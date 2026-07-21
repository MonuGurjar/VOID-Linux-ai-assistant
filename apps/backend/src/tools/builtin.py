import os
import re
import shutil
import platform
import psutil
import asyncio
import subprocess
import json
import zipfile
import tarfile
import urllib.request
from typing import Dict, Any, List, Optional
from .registry import Tool, registry

# ---------------------------------------------------------
# 1. TERMINAL TOOLS
# ---------------------------------------------------------

class TerminalExecuteTool(Tool):
    @property
    def name(self) -> str:
        return "terminal_execute"

    @property
    def description(self) -> str:
        return "Safely execute a bash command on the Linux system and return output (stdout/stderr)."

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "command": {"type": "string", "description": "The exact bash command line to execute."},
                "cwd": {"type": "string", "description": "Optional working directory path."}
            },
            "required": ["command"]
        }

    async def execute(self, command: str, cwd: str = None, **kwargs) -> Dict[str, Any]:
        try:
            work_dir = cwd if cwd and os.path.exists(cwd) else os.getcwd()
            process = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=work_dir
            )
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=45.0)
            return {
                "exit_code": process.returncode,
                "stdout": stdout.decode("utf-8", errors="ignore"),
                "stderr": stderr.decode("utf-8", errors="ignore"),
                "success": process.returncode == 0
            }
        except asyncio.TimeoutError:
            return {"error": "Command execution timed out after 45 seconds", "success": False}
        except Exception as e:
            return {"error": str(e), "success": False}


# ---------------------------------------------------------
# 2. FILESYSTEM TOOLS
# ---------------------------------------------------------

class FilesystemReadTool(Tool):
    @property
    def name(self) -> str:
        return "filesystem_read"

    @property
    def description(self) -> str:
        return "Read the contents of a local text or code file."

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "filepath": {"type": "string", "description": "Absolute path to the target file."}
            },
            "required": ["filepath"]
        }

    async def execute(self, filepath: str, **kwargs) -> Dict[str, Any]:
        try:
            full_p = os.path.abspath(filepath)
            if not os.path.exists(full_p):
                return {"error": f"File does not exist: {filepath}", "success": False}
            if os.path.getsize(full_p) > 5 * 1024 * 1024:
                return {"error": "File size exceeds 5MB limit", "success": False}

            with open(full_p, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            return {"filepath": full_p, "content": content, "success": True}
        except Exception as e:
            return {"error": str(e), "success": False}


class FilesystemWriteTool(Tool):
    @property
    def name(self) -> str:
        return "filesystem_write"

    @property
    def description(self) -> str:
        return "Write or overwrite content to a local file."

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "filepath": {"type": "string", "description": "Absolute path to target file."},
                "content": {"type": "string", "description": "The exact content to write."}
            },
            "required": ["filepath", "content"]
        }

    async def execute(self, filepath: str, content: str, **kwargs) -> Dict[str, Any]:
        try:
            full_p = os.path.abspath(filepath)
            os.makedirs(os.path.dirname(full_p), exist_ok=True)
            with open(full_p, "w", encoding="utf-8") as f:
                f.write(content)
            return {"filepath": full_p, "bytes_written": len(content), "success": True}
        except Exception as e:
            return {"error": str(e), "success": False}


class FilesystemListTool(Tool):
    @property
    def name(self) -> str:
        return "filesystem_list"

    @property
    def description(self) -> str:
        return "List files and subdirectories inside a directory path."

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "directory_path": {"type": "string", "description": "Absolute path of directory to inspect."}
            },
            "required": ["directory_path"]
        }

    async def execute(self, directory_path: str = None, path: str = None, directory: str = None, **kwargs) -> Dict[str, Any]:
        target = directory_path or path or directory or "."
        try:
            full_p = os.path.abspath(os.path.expanduser(target))
            if not os.path.exists(full_p):
                return {"error": f"Directory not found: {target}", "success": False}

            items = []
            for item in os.listdir(full_p):
                fp = os.path.join(full_p, item)
                items.append({
                    "name": item,
                    "is_dir": os.path.isdir(fp),
                    "size": os.path.getsize(fp) if os.path.isfile(fp) else None
                })
            return {"directory": full_p, "items": items, "success": True}
        except Exception as e:
            return {"error": str(e), "success": False}


class FilesystemMoveTool(Tool):
    @property
    def name(self) -> str:
        return "filesystem_move"

    @property
    def description(self) -> str:
        return "Move or rename a file or directory."

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "src": {"type": "string", "description": "Source path."},
                "dest": {"type": "string", "description": "Destination path."}
            },
            "required": ["src", "dest"]
        }

    async def execute(self, src: str, dest: str, **kwargs) -> Dict[str, Any]:
        try:
            src_p = os.path.abspath(src)
            dest_p = os.path.abspath(dest)
            if not os.path.exists(src_p):
                return {"error": f"Source does not exist: {src}", "success": False}
            shutil.move(src_p, dest_p)
            return {"src": src_p, "dest": dest_p, "success": True}
        except Exception as e:
            return {"error": str(e), "success": False}


class FilesystemCopyTool(Tool):
    @property
    def name(self) -> str:
        return "filesystem_copy"

    @property
    def description(self) -> str:
        return "Copy a file or directory to a destination path."

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "src": {"type": "string", "description": "Source path."},
                "dest": {"type": "string", "description": "Destination path."}
            },
            "required": ["src", "dest"]
        }

    async def execute(self, src: str, dest: str, **kwargs) -> Dict[str, Any]:
        try:
            src_p = os.path.abspath(src)
            dest_p = os.path.abspath(dest)
            if not os.path.exists(src_p):
                return {"error": f"Source path does not exist: {src}", "success": False}

            if os.path.isdir(src_p):
                shutil.copytree(src_p, dest_p, dirs_exist_ok=True)
            else:
                os.makedirs(os.path.dirname(dest_p), exist_ok=True)
                shutil.copy2(src_p, dest_p)
            return {"src": src_p, "dest": dest_p, "success": True}
        except Exception as e:
            return {"error": str(e), "success": False}


class FilesystemDeleteTool(Tool):
    @property
    def name(self) -> str:
        return "filesystem_delete"

    @property
    def description(self) -> str:
        return "Delete a file or directory permanently."

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "target_path": {"type": "string", "description": "Absolute path to delete."}
            },
            "required": ["target_path"]
        }

    async def execute(self, target_path: str, **kwargs) -> Dict[str, Any]:
        try:
            full_p = os.path.abspath(target_path)
            if not os.path.exists(full_p):
                return {"error": f"Target does not exist: {target_path}", "success": False}

            if os.path.isdir(full_p):
                shutil.rmtree(full_p)
            else:
                os.remove(full_p)
            return {"deleted": full_p, "success": True}
        except Exception as e:
            return {"error": str(e), "success": False}


class FilesystemSearchTool(Tool):
    @property
    def name(self) -> str:
        return "filesystem_search"

    @property
    def description(self) -> str:
        return "Search for files by filename pattern or text substring within a directory."

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "directory": {"type": "string", "description": "Search root directory."},
                "pattern": {"type": "string", "description": "Filename search pattern or extension (e.g. *.py, config)."}
            },
            "required": ["directory", "pattern"]
        }

    async def execute(self, directory: str, pattern: str, **kwargs) -> Dict[str, Any]:
        try:
            root_p = os.path.abspath(directory)
            if not os.path.exists(root_p):
                return {"error": f"Directory not found: {directory}", "success": False}

            matches = []
            clean_pattern = pattern.replace("*", "").lower()

            for dirpath, _, filenames in os.walk(root_p):
                for f in filenames:
                    if clean_pattern in f.lower():
                        matches.append(os.path.join(dirpath, f))
                        if len(matches) >= 100:
                            break
                if len(matches) >= 100:
                    break

            return {"root": root_p, "count": len(matches), "matches": matches, "success": True}
        except Exception as e:
            return {"error": str(e), "success": False}


class FilesystemArchiveTool(Tool):
    @property
    def name(self) -> str:
        return "filesystem_archive"

    @property
    def description(self) -> str:
        return "Compress a directory into a .zip archive or extract an existing archive."

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "action": {"type": "string", "enum": ["compress", "extract"], "description": "Compression action."},
                "source": {"type": "string", "description": "Source directory/archive file."},
                "destination": {"type": "string", "description": "Destination file/directory."}
            },
            "required": ["action", "source", "destination"]
        }

    async def execute(self, action: str, source: str, destination: str, **kwargs) -> Dict[str, Any]:
        try:
            src_p = os.path.abspath(source)
            dest_p = os.path.abspath(destination)

            if action == "compress":
                shutil.make_archive(dest_p.replace(".zip", ""), "zip", src_p)
                return {"archive": dest_p if dest_p.endswith(".zip") else f"{dest_p}.zip", "success": True}
            elif action == "extract":
                shutil.unpack_archive(src_p, dest_p)
                return {"extracted_to": dest_p, "success": True}
            else:
                return {"error": "Invalid action", "success": False}
        except Exception as e:
            return {"error": str(e), "success": False}


# ---------------------------------------------------------
# 3. LINUX SYSTEM & PROCESS CONTROL
# ---------------------------------------------------------

class SystemInfoTool(Tool):
    @property
    def name(self) -> str:
        return "system_info"

    @property
    def description(self) -> str:
        return "Get real-time Linux system diagnostics: CPU model name, RAM, Disk usage, OS distribution, and Uptime."

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {"type": "object", "properties": {}}

    @property
    def requires_approval(self) -> bool:
        return False

    def _get_cpu_model(self) -> str:
        try:
            with open("/proc/cpuinfo", "r") as f:
                for line in f:
                    if "model name" in line:
                        return line.split(":")[1].strip()
        except Exception:
            pass
        return platform.processor() or "x86_64 CPU"

    def _get_distro_name(self) -> str:
        try:
            with open("/etc/os-release", "r") as f:
                for line in f:
                    if line.startswith("PRETTY_NAME="):
                        return line.split("=")[1].strip('"\n')
        except Exception:
            pass
        return f"Linux {platform.release()}"

    async def execute(self, **kwargs) -> Dict[str, Any]:
        try:
            mem = psutil.virtual_memory()
            disk = psutil.disk_usage("/")
            return {
                "os": platform.system(),
                "distro": self._get_distro_name(),
                "kernel_release": platform.release(),
                "machine": platform.machine(),
                "cpu_model": self._get_cpu_model(),
                "cpu_cores_physical": psutil.cpu_count(logical=False) or 1,
                "cpu_cores_logical": psutil.cpu_count(logical=True) or 1,
                "cpu_usage_percent": psutil.cpu_percent(interval=0.1),
                "ram_total_gb": round(mem.total / (1024**3), 2),
                "ram_used_gb": round(mem.used / (1024**3), 2),
                "ram_percent": mem.percent,
                "disk_total_gb": round(disk.total / (1024**3), 2),
                "disk_free_gb": round(disk.free / (1024**3), 2),
                "disk_percent": disk.percent,
                "success": True
            }
        except Exception as e:
            return {"error": str(e), "success": False}


class ProcessManagerTool(Tool):
    @property
    def name(self) -> str:
        return "process_manager"

    @property
    def description(self) -> str:
        return "List top running processes or terminate a process by PID."

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "action": {"type": "string", "enum": ["list", "kill"], "description": "Process action."},
                "pid": {"type": "integer", "description": "Process ID (required for kill action)."}
            },
            "required": ["action"]
        }

    async def execute(self, action: str, pid: int = None, **kwargs) -> Dict[str, Any]:
        try:
            if action == "list":
                procs = []
                for p in sorted(psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']), key=lambda x: x.info['cpu_percent'] or 0, reverse=True)[:15]:
                    procs.append(p.info)
                return {"processes": procs, "success": True}
            elif action == "kill":
                if not pid:
                    return {"error": "PID is required to kill a process", "success": False}
                p = psutil.Process(pid)
                p.terminate()
                return {"killed_pid": pid, "success": True}
            else:
                return {"error": "Invalid action", "success": False}
        except Exception as e:
            return {"error": str(e), "success": False}


class ServiceManagerTool(Tool):
    @property
    def name(self) -> str:
        return "service_manager"

    @property
    def description(self) -> str:
        return "Check status or manage systemd services (systemctl status/start/stop/restart)."

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "service_name": {"type": "string", "description": "Systemd service name (e.g. docker, bluetooth, NetworkManager)."},
                "action": {"type": "string", "enum": ["status", "start", "stop", "restart"], "description": "Systemctl action."}
            },
            "required": ["service_name", "action"]
        }

    async def execute(self, service_name: str, action: str, **kwargs) -> Dict[str, Any]:
        try:
            cmd = f"systemctl {action} {service_name}"
            process = await asyncio.create_subprocess_shell(
                cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            return {
                "service": service_name,
                "action": action,
                "exit_code": process.returncode,
                "output": stdout.decode("utf-8", errors="ignore") or stderr.decode("utf-8", errors="ignore"),
                "success": process.returncode == 0
            }
        except Exception as e:
            return {"error": str(e), "success": False}


class PackageManagerQueryTool(Tool):
    @property
    def name(self) -> str:
        return "package_manager_query"

    @property
    def description(self) -> str:
        return "Check if a software package is installed on the Linux system."

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "package_name": {"type": "string", "description": "Package name to query (e.g. docker, git, python3)."}
            },
            "required": ["package_name"]
        }

    async def execute(self, package_name: str, **kwargs) -> Dict[str, Any]:
        installed = shutil.which(package_name) is not None
        return {
            "package_name": package_name,
            "installed": installed,
            "executable_path": shutil.which(package_name) or "",
            "success": True
        }


# ---------------------------------------------------------
# 4. NETWORK & WEB TOOLS
# ---------------------------------------------------------

class WebFetchTool(Tool):
    @property
    def name(self) -> str:
        return "web_fetch"

    @property
    def description(self) -> str:
        return "Fetch text content from a web URL."

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "url": {"type": "string", "description": "HTTP/HTTPS URL to fetch."}
            },
            "required": ["url"]
        }

    async def execute(self, url: str, **kwargs) -> Dict[str, Any]:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (VOID Linux AI Assistant)"})
            with urllib.request.urlopen(req, timeout=10) as response:
                html = response.read().decode("utf-8", errors="ignore")
                # Basic HTML tag strip
                text = re.sub(r'<[^>]+>', ' ', html)
                text = re.sub(r'\s+', ' ', text).strip()
                return {"url": url, "content": text[:4000], "success": True}
        except Exception as e:
            return {"error": str(e), "success": False}


class NetworkPingTool(Tool):
    @property
    def name(self) -> str:
        return "network_ping"

    @property
    def description(self) -> str:
        return "Check network connectivity to a domain or IP address."

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "host": {"type": "string", "description": "Target hostname or IP (e.g. google.com, 1.1.1.1)."}
            },
            "required": ["host"]
        }

    async def execute(self, host: str, **kwargs) -> Dict[str, Any]:
        try:
            cmd = f"ping -c 3 {host}"
            process = await asyncio.create_subprocess_shell(
                cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await process.communicate()
            return {"host": host, "ping_output": stdout.decode("utf-8", errors="ignore"), "online": process.returncode == 0, "success": True}
        except Exception as e:
            return {"error": str(e), "success": False}


# ---------------------------------------------------------
# 5. DEV & AGENT POWER TOOLS (Bonus added by VOID)
# ---------------------------------------------------------

class GitStatusTool(Tool):
    @property
    def name(self) -> str:
        return "git_status"

    @property
    def description(self) -> str:
        return "Inspect git status, recent commits, and active branch of a local repository."

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "repo_path": {"type": "string", "description": "Path to local Git repository directory."}
            },
            "required": ["repo_path"]
        }

    async def execute(self, repo_path: str, **kwargs) -> Dict[str, Any]:
        try:
            full_p = os.path.abspath(repo_path)
            process = await asyncio.create_subprocess_shell(
                "git status -s && echo '--- LOG ---' && git log -n 5 --oneline",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=full_p
            )
            stdout, stderr = await process.communicate()
            return {"repo": full_p, "output": stdout.decode("utf-8", errors="ignore"), "success": process.returncode == 0}
        except Exception as e:
            return {"error": str(e), "success": False}


class DockerManagerTool(Tool):
    @property
    def name(self) -> str:
        return "docker_manager"

    @property
    def description(self) -> str:
        return "Inspect running Docker containers and images."

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "action": {"type": "string", "enum": ["ps", "images"], "description": "Docker action."}
            },
            "required": ["action"]
        }

    async def execute(self, action: str, **kwargs) -> Dict[str, Any]:
        try:
            cmd = f"docker {action}"
            process = await asyncio.create_subprocess_shell(
                cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            return {"action": action, "output": stdout.decode("utf-8", errors="ignore"), "success": process.returncode == 0}
        except Exception as e:
            return {"error": str(e), "success": False}


# ---------------------------------------------------------
# REGISTRATION
# ---------------------------------------------------------

def register_builtin_tools():
    # Terminal
    registry.register(TerminalExecuteTool())
    # Filesystem
    registry.register(FilesystemReadTool())
    registry.register(FilesystemWriteTool())
    registry.register(FilesystemListTool())
    registry.register(FilesystemMoveTool())
    registry.register(FilesystemCopyTool())
    registry.register(FilesystemDeleteTool())
    registry.register(FilesystemSearchTool())
    registry.register(FilesystemArchiveTool())
    # Linux & System
    registry.register(SystemInfoTool())
    registry.register(ProcessManagerTool())
    registry.register(ServiceManagerTool())
    registry.register(PackageManagerQueryTool())
    # Web & Network
    registry.register(WebFetchTool())
    registry.register(NetworkPingTool())
    # Dev & Agent Power Tools
    registry.register(GitStatusTool())
    registry.register(DockerManagerTool())

register_builtin_tools()
