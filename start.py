#!/usr/bin/env python3
"""
VOID AI Assistant — Cross-Platform Python Unified Launcher
Runs both FastAPI Backend and Desktop Frontend with 1 command.
"""
import sys
import os
import subprocess
import time
import signal
import urllib.request

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "apps", "backend")
DESKTOP_DIR = os.path.join(ROOT_DIR, "apps", "desktop")

run_tauri = "--tauri" in sys.argv or "-t" in sys.argv

print("========================================================")
print(" 🌌 Launching VOID AI Assistant Services (Python Launcher)")
print("========================================================")

backend_proc = None
frontend_proc = None

def cleanup(sig=None, frame=None):
    print("\n🛑 Stopping VOID Assistant processes...")
    if backend_proc and backend_proc.poll() is None:
        backend_proc.terminate()
    if frontend_proc and frontend_proc.poll() is None:
        frontend_proc.terminate()
    print("✨ All services stopped cleanly.")
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

# 1. Start Backend
print("⚡ [1/2] Starting FastAPI Backend on http://127.0.0.1:8000...")
backend_proc = subprocess.Popen(
    ["uv", "run", "uvicorn", "src.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"],
    cwd=BACKEND_DIR
)

# Wait for health
print("⏳ Waiting for backend readiness...")
for _ in range(15):
    try:
        req = urllib.request.urlopen("http://127.0.0.1:8000/", timeout=1)
        if req.getcode() == 200:
            print("✅ Backend API is ready!")
            break
    except Exception:
        pass
    time.sleep(0.8)

# 2. Start Frontend
print(f"🚀 [2/2] Launching {'Tauri Desktop' if run_tauri else 'Frontend UI'}...")
cmd = ["pnpm", "tauri", "dev"] if run_tauri else ["pnpm", "dev"]
frontend_proc = subprocess.Popen(cmd, cwd=DESKTOP_DIR)

print("========================================================")
print(" 🟢 VOID AI Assistant is running!")
print(" ➜ Backend API: http://127.0.0.1:8000")
print(" ➜ Frontend UI: http://localhost:5173")
print(" 💡 Press Ctrl+C anytime to stop all services.")
print("========================================================")

try:
    frontend_proc.wait()
except KeyboardInterrupt:
    cleanup()
