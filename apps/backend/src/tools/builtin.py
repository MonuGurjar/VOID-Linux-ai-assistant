import os
import shutil
import platform
import psutil
import asyncio
import subprocess
from typing import Dict, Any, List
from .registry import Tool, registry

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
                "command": {
                    "type": "string",
                    "description": "The exact bash command line to execute."
                },
                "cwd": {
                    "type": "string",
                    "description": "Optional working directory path."
                }
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
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=30.0)
            return {
                "exit_code": process.returncode,
                "stdout": stdout.decode("utf-8", errors="ignore"),
                "stderr": stderr.decode("utf-8", errors="ignore"),
                "success": process.returncode == 0
            }
        except asyncio.TimeoutError:
            return {"error": "Command execution timed out after 30 seconds", "success": False}
        except Exception as e:
            return {"error": str(e), "success": False}


class FilesystemReadTool(Tool):
    @property
    def name(self) -> str:
        return "filesystem_read"

    @property
    def description(self) -> str:
        return "Read the contents of a local file."

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "filepath": {
                    "type": "string",
                    "description": "Absolute path to the target file."
                }
            },
            "required": ["filepath"]
        }

    async def execute(self, filepath: str, **kwargs) -> Dict[str, Any]:
        try:
            if not os.path.isabs(filepath):
                filepath = os.path.abspath(filepath)
            if not os.path.exists(filepath):
                return {"error": f"File does not exist: {filepath}", "success": False}
            if os.path.getsize(filepath) > 2 * 1024 * 1024:
                return {"error": "File size exceeds 2MB limit", "success": False}

            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            return {"filepath": filepath, "content": content, "success": True}
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
                "filepath": {
                    "type": "string",
                    "description": "Absolute path to target file."
                },
                "content": {
                    "type": "string",
                    "description": "The exact content to write."
                }
            },
            "required": ["filepath", "content"]
        }

    async def execute(self, filepath: str, content: str, **kwargs) -> Dict[str, Any]:
        try:
            if not os.path.isabs(filepath):
                filepath = os.path.abspath(filepath)
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)
            return {"filepath": filepath, "bytes_written": len(content), "success": True}
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
                "directory_path": {
                    "type": "string",
                    "description": "Absolute path of directory to inspect."
                }
            },
            "required": ["directory_path"]
        }

    async def execute(self, directory_path: str, **kwargs) -> Dict[str, Any]:
        try:
            if not os.path.exists(directory_path):
                return {"error": f"Directory not found: {directory_path}", "success": False}

            items = []
            for item in os.listdir(directory_path):
                full_p = os.path.join(directory_path, item)
                items.append({
                    "name": item,
                    "is_dir": os.path.isdir(full_p),
                    "size": os.path.getsize(full_p) if os.path.isfile(full_p) else None
                })
            return {"directory": directory_path, "items": items, "success": True}
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
                "package_name": {
                    "type": "string",
                    "description": "Software package name to query (e.g. docker, git, python3)."
                }
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


class SystemInfoTool(Tool):
    @property
    def name(self) -> str:
        return "system_info"

    @property
    def description(self) -> str:
        return "Get real-time Linux system diagnostics: CPU model name, RAM, Disk usage, OS distribution, and Uptime."

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {}
        }

    @property
    def requires_approval(self) -> bool:
        return False  # Read-only safe system diagnostics

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


# Register all built-in tools automatically
def register_builtin_tools():
    registry.register(TerminalExecuteTool())
    registry.register(FilesystemReadTool())
    registry.register(FilesystemWriteTool())
    registry.register(FilesystemListTool())
    registry.register(PackageManagerQueryTool())
    registry.register(SystemInfoTool())

register_builtin_tools()
