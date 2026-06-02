import time
from PyQt6.QtCore import QThread, pyqtSignal
from core.llm_client import LLMClient
from security.guardrails import check_command_safety, requires_approval
import tools.system_ops as system_ops

class AgentWorker(QThread):
    response_signal = pyqtSignal(str)
    # Signal to UI: list of dicts with {'id': int, 'name': str, 'args': dict, 'reason': str}
    batch_sensitive_action_signal = pyqtSignal(list)
    finished_signal = pyqtSignal()
    
    def __init__(self):
        super().__init__()
        self.llm_client = LLMClient()
        self.user_input = ""
        self._batch_results = {}
        self._wait_condition = False
        
    def process_input(self, text: str):
        self.user_input = text
        self.start()

    def run(self):
        try:
            if self.user_input:
                message = self.llm_client.chat(self.user_input)
                self.handle_message(message)
        finally:
            self.finished_signal.emit()

    def handle_message(self, message: dict):
        if 'tool_calls' in message and message['tool_calls']:
            batch_to_approve = []
            
            for i, tool_call in enumerate(message['tool_calls']):
                func_name = tool_call['function']['name']
                func_args = tool_call['function']['arguments']
                
                # Check guardrails
                if func_name == "execute_shell_command":
                    cmd = func_args.get("command", "")
                    is_safe, reason = check_command_safety(cmd)
                    if not is_safe:
                        self.response_signal.emit(f"Blocked execution of '{cmd}': {reason}")
                        self._batch_results[func_name] = f"Blocked: {reason}"
                        continue
                
                if requires_approval(func_name):
                    batch_to_approve.append({
                        'id': i,
                        'name': func_name,
                        'args': func_args,
                        'reason': f"Requires user approval."
                    })
                else:
                    # Safe action, execute immediately
                    try:
                        func = getattr(system_ops, func_name)
                        res = func(**func_args)
                        self._batch_results[func_name] = str(res)
                    except Exception as e:
                        self._batch_results[func_name] = f"Error: {str(e)}"

            if batch_to_approve:
                self._wait_condition = True
                self.batch_sensitive_action_signal.emit(batch_to_approve)
                
                # Block thread until UI sets _wait_condition to False
                while self._wait_condition:
                    time.sleep(0.1)

            # Once all are executed or approved/denied, send results to LLM
            final_msg = None
            for func_name, result in self._batch_results.items():
                final_msg = self.llm_client.provide_tool_result(func_name, result)
                
            self._batch_results.clear()
            if final_msg:
                self.handle_message(final_msg)
        else:
            content = message.get('content', '')
            if content:
                self.response_signal.emit(content)

    def resolve_batch_action(self, func_name: str, args: dict, approved: bool):
        """Called by the UI when the user approves/denies an action in the batch."""
        if approved:
            try:
                func = getattr(system_ops, func_name)
                res = func(**args)
                self._batch_results[func_name] = str(res)
                self.response_signal.emit(f"Executed approved action: {func_name}")
            except Exception as e:
                self._batch_results[func_name] = f"Error: {str(e)}"
        else:
            self._batch_results[func_name] = "Denied by user."
            self.response_signal.emit(f"Action '{func_name}' was denied.")

    def finalize_batch(self):
        """Called by UI when all actions in the batch are resolved."""
        self._wait_condition = False
