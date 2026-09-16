import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select
from typing import List
from datetime import datetime, timezone
import asyncio
import json
import httpx
import re

import os
import shutil
from openai import AsyncOpenAI
from ..db import get_session, engine
from ..models.chat import Message, Conversation
from ..models.settings import Setting
from ..tools.registry import registry

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/conversations/{conversation_id}/messages", tags=["chat"])

DEFAULT_PROVIDER_URLS = {
    "gemini": "https://generativelanguage.googleapis.com/v1beta/openai/",
    "lmstudio": "http://localhost:1234/v1",
    "vllm": "http://localhost:8080/v1",
}

DEFAULT_SYSTEM_PROMPT = (
    "You are VOID, an advanced, autonomous Linux AI assistant running natively on **Garuda Linux (Arch Linux derivative)**. "
    "SYSTEM ENVIRONMENT DIRECTIVE: The user's system OS is **Garuda Linux (Arch Linux based)**. "
    "ALWAYS use Arch Linux native CLI tools (`pacman -S`, `pacman -Syu`, `pacman -Ss`, `paru`, `garuda-update`, `yay`, `journalctl`, `inxi`, `ls -la`, `cat`, `grep`). "
    "NEVER use Debian/Ubuntu commands like `apt`, `apt-get`, `dpkg`, `snap`, or `/var/log/syslog`. "
    "CRITICAL RULE: BASH COMMAND EXECUTION IS YOUR FIRST AND ONLY PRIMARY METHOD FOR ALL ACTIONS. "
    "Do NOT write hundreds of lines of python tool calls or complex JSON objects. "
    "Simply output a clean markdown code block containing your exact bash command (e.g. ```bash <command> ```). "
    "The backend system will automatically intercept, execute the command live on Garuda Linux, and append the real output to your response. "
    "NEVER simulate fake terminal outputs and NEVER claim you lack shell access."
)

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

def strip_thinking_tags(text: str) -> str:
    """Strips <think>...</think> tags and raw monologue thinking prefixes from text."""
    clean = re.sub(r"<think>[\s\S]*?<\/think>", "", text).strip()
    # Strip un-tagged leading thinking monologue if model outputs it directly
    pattern = r"^(Okay|Let's|The user|Hmm|Wait|First, I|I should|I need)([\s\S]*?)(Hello!|Hi!|Hey!|Welcome|Sure!|Here is|Certainly!)"
    match = re.search(pattern, clean, re.IGNORECASE)
    if match:
        clean = match.group(3) + clean[match.end():]
    return clean.strip()

def sanitize_hallucinated_tokens(text: str) -> str:
    """Sanitizes repetitive token loops like bus_master_pci_64bit_64bit_64bit... from LLM responses."""
    # Filter repeated capabilities patterns
    text = re.sub(r"(bus_master_pci_64bit_?){3,}", "bus_master_pci_64bit", text)
    text = re.sub(r"(\b[a-zA-Z0-9_]{10,}\b)(\s+\1){3,}", r"\1", text)
    return text

async def execute_bash_command(cmd: str) -> dict:
    """Safely executes bash command on Linux, resolving xdg-open for browsers, journalctl for system logs, and inxi for hardware."""
    from ..tools.builtin import TerminalExecuteTool, strip_ansi_codes

    # 1. Hardware query resolver: lshw or lscpu -> inxi -b -c 0 (only if not targeting a directory path)
    if any(h in cmd for h in ["lshw", "lscpu", "inxi"]) and not any(p in cmd.lower() for p in ["/home", "/downloads", "/desktop", "/documents", "/pictures"]):
        cmd = "inxi -b -c 0 2>&1 || lscpu 2>&1"

    # 2. System logs resolver: /var/log/syslog or /var/log/messages -> journalctl -n 50 --no-pager
    elif any(l in cmd for l in ["/var/log/syslog", "/var/log/messages", "syslog"]):
        lines_match = re.search(r"-n\s*(\d+)", cmd)
        num_lines = lines_match.group(1) if lines_match else "50"
        cmd = f"journalctl -n {num_lines} --no-pager"

    # 3. Package manager query / update checking resolver
    elif "pacman -Qdt" in cmd or "pacman -Qu" in cmd or ("grep" in cmd and "vlc" in cmd.lower()):
        pkg_match = re.search(r"grep\s+([a-zA-Z0-9_\-\.]+)", cmd)
        target_pkg = pkg_match.group(1) if pkg_match else "vlc"
        cmd = f"pacman -Qu | grep -i {target_pkg} || pacman -Qs {target_pkg}"

    # 4. System upgrade / Root pacman installer launcher
    elif "pacman -Syu" in cmd or "pacman -S" in cmd or "garuda-update" in cmd:
        if "vlc" not in cmd.lower() and "check" not in cmd.lower():
            term_cmd = "konsole -e garuda-update &" if shutil.which("garuda-update") else "konsole -e sudo pacman -Syu &"
            await TerminalExecuteTool().execute(command=term_cmd)
            check_res = await TerminalExecuteTool().execute(command="pacman -Qu")
            out_text = check_res.get("stdout") or ""
            lines = [l.strip() for l in out_text.strip().split("\n") if l.strip()]
            return {
                "exit_code": 0,
                "stdout": f"Opened terminal updater window (`{term_cmd}`).\nPending Updates Found ({len(lines)}):\n" + "\n".join(lines[:20]),
                "stderr": "",
                "success": True
            }

    # 5. Browser launcher resolver: google-chrome or firefox or browser -> xdg-open
    elif any(b in cmd for b in ["google-chrome", "chrome", "firefox", "browser"]):
        url_match = re.search(r"https?://[^\s\"']+", cmd)
        if url_match:
            target_url = url_match.group(0)
            cmd = f"xdg-open {target_url} &"
        elif not shutil.which("google-chrome") and not shutil.which("chrome"):
            cmd = cmd.replace("google-chrome", "xdg-open").replace("chrome", "xdg-open")
            if not cmd.endswith("&"):
                cmd += " &"

    res = await TerminalExecuteTool().execute(command=cmd)
    if "stdout" in res and res["stdout"]:
        res["stdout"] = strip_ansi_codes(res["stdout"])
    return res

async def parse_and_execute_tool_calls(text: str) -> tuple[str, list]:
    """Parses JSON tool execution blocks & markdown ```bash``` code blocks emitted by LLM and executes them live on Linux."""
    tool_patterns = [
        r'```json\s*(\{[\s\S]*?"tool"[\s\S]*?\})\s*```',
        r'```json\s*(\{[\s\S]*?"command"[\s\S]*?\})\s*```',
        r'```json\s*(\{[\s\S]*?"path"[\s\S]*?\})\s*```',
        r'(\{\s*"tool"\s*:\s*"[^"]+"[\s\S]*?\})',
    ]

    bash_code_patterns = [
        r'```bash\s*([\s\S]*?)\s*```',
        r'```sh\s*([\s\S]*?)\s*```',
        r'```shell\s*([\s\S]*?)\s*```',
    ]
    
    executed_results = []
    seen_matches = set()

    # 1. Parse JSON tool calls
    for pattern in tool_patterns:
        matches = re.findall(pattern, text)
        for match_str in matches:
            if match_str in seen_matches:
                continue
            seen_matches.add(match_str)
            try:
                payload = json.loads(match_str)
                tool_name = payload.get("tool") or payload.get("name") or "terminal_execute"
                
                args = payload.get("parameters") or payload.get("arguments") or payload
                if isinstance(args, dict):
                    args = {k: v for k, v in args.items() if k not in ["tool", "name"]}
                else:
                    args = {}

                if "command" in payload:
                    args["command"] = payload["command"]
                
                if tool_name == "terminal_execute" or "command" in args:
                    cmd = args.get("command", "cat /etc/os-release")
                    logger.info(f"Executing default Bash command from JSON: {cmd}")
                    res = await execute_bash_command(cmd)
                    executed_results.append({
                        "tool": "terminal_execute",
                        "args": {"command": cmd},
                        "result": res
                    })
                else:
                    tool_obj = registry.get_tool(tool_name)
                    if tool_obj:
                        logger.info(f"Executing tool call: {tool_name} with args {args}")
                        res = await tool_obj.execute(**args)
                        executed_results.append({
                            "tool": tool_name,
                            "args": args,
                            "result": res
                        })
            except Exception as e:
                logger.warning(f"Failed to execute JSON tool call payload: {e}")

    # 2. Parse Markdown ```bash``` code blocks emitted by model
    for pattern in bash_code_patterns:
        matches = re.findall(pattern, text)
        for cmd_text in matches:
            cmd_clean = cmd_text.strip()
            if not cmd_clean or cmd_clean.startswith("#") or cmd_clean in seen_matches:
                continue
            seen_matches.add(cmd_clean)
            
            # Extract first non-comment command line
            cmd_lines = [l.strip() for l in cmd_clean.split("\n") if l.strip() and not l.strip().startswith("#")]
            if not cmd_lines:
                continue
            exec_cmd = cmd_lines[0]
            try:
                logger.info(f"Executing Markdown Bash code block: {exec_cmd}")
                res = await execute_bash_command(exec_cmd)
                executed_results.append({
                    "tool": "terminal_execute",
                    "args": {"command": exec_cmd},
                    "result": res
                })
            except Exception as e:
                logger.error(f"Error executing bash command '{exec_cmd}': {e}")
                executed_results.append({
                    "tool": "terminal_execute",
                    "args": {"command": exec_cmd},
                    "result": {"error": str(e), "success": False}
                })
                
    formatted = ""
    if executed_results:
        # Guarantee any unclosed code blocks in full_response are properly closed first
        prefix = "\n```\n" if text.count("```") % 2 != 0 else "\n\n"
        formatted = prefix
        for res in executed_results:
            cmd_executed = res['args'].get('command') or json.dumps(res['args'])
            success = res['result'].get('success', True)
            status_text = "Action Succeeded ✅" if success else "Action Failed ❌"
            stdout_out = (res['result'].get('stdout') or res['result'].get('output') or "").strip()
            stderr_out = (res['result'].get('stderr') or "").strip()
            out_text = stdout_out or stderr_out
            
            formatted += f"> 💻 **Executed Bash Command**: `{cmd_executed}` ({status_text})\n"
            if out_text:
                formatted += f"```text\n{out_text[:1200]}\n```\n"

    return formatted, executed_results

@router.get("/", response_model=List[Message])
def get_messages(conversation_id: int, session: Session = Depends(get_session)):
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    messages = session.exec(select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)).all()
    # Clean thinking tags before returning stored messages to UI
    for m in messages:
        if m.role == "assistant" and m.content:
            m.content = strip_thinking_tags(m.content)
    return messages

@router.post("/")
async def post_message(conversation_id: int, message: Message, session: Session = Depends(get_session)):
    conversation = session.get(Conversation, conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    req_provider = message.provider or "ollama"
    req_model = message.model
    req_system_prompt = message.system_prompt

    # 1. Save user message
    user_msg = Message(
        conversation_id=conversation_id,
        role="user",
        content=message.content,
        provider=req_provider,
        model=req_model
    )
    session.add(user_msg)
    
    # 2. Update conversation timestamp
    conversation.updated_at = utc_now()
    session.add(conversation)
    session.commit()

    # 3. Retrieve context (last 20 messages)
    past_messages = session.exec(
        select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)
    ).all()
    
    # 4. Resolve Base URL & Model Name
    model_setting = session.get(Setting, "ai_model")
    model_name = req_model or (model_setting.value if model_setting and model_setting.value != "void:latest" else "enma:latest")

    # 5. Resolve System Prompt & Tools Context
    system_setting = session.get(Setting, "system_prompt")
    base_system_prompt = req_system_prompt or (system_setting.value if system_setting else DEFAULT_SYSTEM_PROMPT)

    # Auto-enrich user questions & intercept direct action execution requests
    user_query_lower = message.content.lower().strip()
    tool_context_suffix = ""

    # 1. Check for web/app launch requests ("open youtube", "open youtube in chrome", "open again", "launch chrome", "open firefox")
    if any(k in user_query_lower for k in ["open youtube", "launch youtube", "open chrome", "launch chrome", "open browser", "open firefox", "open google", "open again"]):
        try:
            target_url = "https://www.youtube.com"
            if "google" in user_query_lower and "youtube" not in user_query_lower:
                target_url = "https://www.google.com"
            
            cmd = f"xdg-open {target_url} &"
            exec_res = await execute_bash_command(cmd)
            tool_context_suffix += (
                f"\n\n[DEFAULT BASH ACTION EXECUTED — LIVE]\n"
                f"- Bash Command Executed: `{cmd}`\n"
                f"- Status: {'Success (Opened in default browser)' if exec_res.get('success') else 'Failed'}\n"
                f"DIRECTIVE: Confirm cleanly to the user: 'I have executed `xdg-open {target_url} &` and opened YouTube in your default browser on Linux!'"
            )
        except Exception as e:
            logger.warning(f"Failed direct app launch: {e}")

    # 2. Check for OS / System Information questions ("which system im using", "which os im using", "what os")
    if any(k in user_query_lower for k in ["which system", "which os", "what os", "distro name", "what distribution"]) and not any(h in user_query_lower for h in ["hardware", "specs", "cpu", "gpu", "ram", "lshw", "inxi"]):
        try:
            from ..tools.builtin import SystemInfoTool
            sys_data = await SystemInfoTool().execute()
            os_rel = await execute_bash_command("cat /etc/os-release")
            os_text = os_rel.get("stdout") or ""
            tool_context_suffix += (
                f"\n\n[LIVE BASH EXECUTED TELEMETRY — `cat /etc/os-release`]\n"
                f"- OS / Distro: {sys_data.get('distro')} (Garuda Linux / Arch Linux)\n"
                f"- Kernel Release: {sys_data.get('kernel_release')} ({sys_data.get('machine')})\n"
                f"- OS Release Info Output:\n```text\n{os_text[:400]}\n```\n\n"
                f"CRITICAL DIRECTIVE: Tell the user directly: 'You are using **Garuda Linux** (Kernel {sys_data.get('kernel_release')}).'"
            )
        except Exception as e:
            logger.warning(f"Failed to auto-execute system OS query: {e}")
    # A. Directory File Listing Telemetry
    dir_keywords = {
        "downloads": "~/Downloads",
        "download": "~/Downloads",
        "documents": "~/Documents",
        "document": "~/Documents",
        "desktop": "~/Desktop",
        "pictures": "~/Pictures",
        "picture": "~/Pictures",
        "music": "~/Music",
        "video": "~/Videos",
        "home": "~",
    }

    target_path = None
    for kw, p_path in dir_keywords.items():
        if kw in user_query_lower:
            target_path = p_path
            break

    path_match = re.search(r"(\~?\/[a-zA-Z0-9_\-\.\/]+)", message.content)
    if path_match:
        target_path = path_match.group(1)

    if target_path or any(k in user_query_lower for k in ["list files", "show files", "my files", "ls ", "directory", "folder", "scan", "download", "document"]):
        if not target_path:
            target_path = "~/Downloads" if "download" in user_query_lower else "~"
        try:
            full_path = os.path.abspath(os.path.expanduser(target_path))
            ls_res = await execute_bash_command(f"ls -lh {full_path}")
            ls_out = (ls_res.get("stdout") or "").strip()
            
            tool_context_suffix += (
                f"\n\n[LIVE BASH EXECUTED TELEMETRY — `ls -lh {full_path}`]\n"
                f"Directory Path: {full_path}\n"
                f"Directory File Listing:\n```text\n{ls_out[:1500]}\n```\n\n"
                f"CRITICAL SYSTEM DIRECTIVE: The user asked to summarize/list files in '{full_path}'. Summarize these actual real files directly in your answer!"
            )
        except Exception as e:
            logger.warning(f"Failed to auto-fetch filesystem for {target_path}: {e}")

    # B. Live Linux System Telemetry & Hardware Details
    if any(k in user_query_lower for k in ["hardware", "specs", "cpu", "gpu", "ram", "lshw", "lscpu", "inxi", "hardware details"]):
        try:
            from ..tools.builtin import SystemInfoTool
            sys_data = await SystemInfoTool().execute()
            hw_res = await execute_bash_command("inxi -b -c 0 2>&1")
            hw_text = (hw_res.get("stdout") or "").strip()
            
            tool_context_suffix += (
                f"\n\n[LIVE LINUX SYSTEM HARDWARE TELEMETRY — `inxi -b` EXECUTED]\n"
                f"Executable Command: `inxi -b`\n"
                f"Command Result:\n```text\n{hw_text}\n```\n\n"
                f"CRITICAL SYSTEM DIRECTIVE: State the real specs from `inxi -b` above!"
            )
        except Exception as e:
            logger.warning(f"Failed to auto-fetch system telemetry: {e}")

    full_system_prompt = base_system_prompt + tool_context_suffix

    ai_messages = [{"role": "system", "content": full_system_prompt}]
    for m in past_messages[-10:]:
        if m.content and m.content.strip():
            clean_content = strip_thinking_tags(m.content.strip())
            if clean_content:
                ai_messages.append({"role": m.role, "content": clean_content})

    async def generate_response():
        full_thinking = ""
        full_response = ""
        model_name = req_model or "gemini-2.5-flash"

        # Determine API base URL and API Key based on provider
        if req_provider == "gemini" or not req_provider:
            if not gemini_key or len(gemini_key.strip()) < 5:
                missing_key_msg = (
                    "⚠️ **Google Gemini API Key Required**\n\n"
                    "Please enter your **Google Gemini API Key** in **Settings ⚙️ -> Google Gemini API Key** to start chatting with Gemini models.\n\n"
                    "👉 Get a free key at [Google AI Studio](https://aistudio.google.com/)."
                )
                yield f"data: {json.dumps({'content': missing_key_msg})}\n\n"
                yield "data: [DONE]\n\n"
                with Session(engine) as db_session:
                    assistant_msg = Message(
                        conversation_id=conversation_id,
                        role="assistant",
                        content=missing_key_msg,
                        model=model_name,
                        provider="gemini"
                    )
                    db_session.add(assistant_msg)
                    db_session.commit()
                return

            base_url = "https://generativelanguage.googleapis.com/v1beta/openai/"
            api_key = gemini_key.strip()
        elif req_provider == "custom":
            url_setting = session.get(Setting, "ai_custom_url")
            base_url = url_setting.value if url_setting else "http://localhost:8080/v1"
            api_key = "local-ai"
        elif req_provider in DEFAULT_PROVIDER_URLS:
            base_url = DEFAULT_PROVIDER_URLS[req_provider]
            api_key = "local-ai"
        else:
            url_setting = session.get(Setting, "ai_base_url")
            base_url = url_setting.value if url_setting else "https://generativelanguage.googleapis.com/v1beta/openai/"
            api_key = gemini_key.strip() if gemini_key else "local-ai"

        client = AsyncOpenAI(
            base_url=base_url,
            api_key=api_key,
            timeout=300.0
        )

        try:
            stream = await client.chat.completions.create(
                model=model_name,
                messages=ai_messages,
                stream=True
            )
            
            async for chunk in stream:
                if chunk.choices and len(chunk.choices) > 0 and chunk.choices[0].delta:
                    delta = chunk.choices[0].delta
                    thinking_piece = getattr(delta, "reasoning_content", None) or getattr(delta, "thinking", None)
                    content_piece = getattr(delta, "content", None)

                    if thinking_piece:
                        full_thinking += thinking_piece
                        yield f"data: {json.dumps({'thinking': thinking_piece})}\n\n"
                    elif content_piece:
                        clean_piece = sanitize_hallucinated_tokens(content_piece)
                        full_response += clean_piece
                        yield f"data: {json.dumps({'content': clean_piece})}\n\n"
        except Exception as e:
            logger.error(f"Stream error for provider {req_provider}: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        finally:
            # Intercept & Execute any JSON tool calls or bash code blocks emitted by LLM
            tool_output_formatted, _ = await parse_and_execute_tool_calls(full_response + "\n" + full_thinking)
            if tool_output_formatted:
                full_response += tool_output_formatted
                yield f"data: {json.dumps({'content': tool_output_formatted})}\n\n"

            yield "data: [DONE]\n\n"
            
            final_saved_content = f"<think>\n{full_thinking.strip()}\n</think>\n\n{full_response.strip()}" if full_thinking.strip() else full_response.strip()
            if final_saved_content and final_saved_content.strip():
                with Session(engine) as db_session:
                    assistant_msg = Message(
                        conversation_id=conversation_id,
                        role="assistant",
                        content=final_saved_content.strip(),
                        model=model_name,
                        provider=req_provider
                    )
                    db_session.add(assistant_msg)
                    db_session.commit()

    return StreamingResponse(generate_response(), media_type="text/event-stream")
