#!/usr/bin/env python3
"""
VOID AI Assistant — Cross-Platform Python Desktop Window Launcher
Runs both FastAPI Backend and opens VOID in a separate Desktop Window.
"""
import sys
import os
import shutil
import subprocess
import time
import signal
import urllib.request
import webbrowser

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(ROOT_DIR, "apps", "backend")
DESKTOP_DIR = os.path.join(ROOT_DIR, "apps", "desktop")

run_web = "--web" in sys.argv or "-w" in sys.argv

# Package Manager Detection
if shutil.which("pnpm"):
    frontend_cmd = ["pnpm", "dev"] if run_web else ["pnpm", "tauri", "dev"]
elif shutil.which("npx"):
    frontend_cmd = ["npx", "pnpm", "dev"] if run_web else ["npx", "pnpm", "tauri", "dev"]
elif shutil.which("npm"):
    frontend_cmd = ["npm", "run", "dev"] if run_web else ["npm", "run", "tauri", "--", "dev"]
else:
    print("❌ Error: No Node.js package manager (pnpm/npx/npm) found in PATH.")
    sys.exit(1)

print("========================================================")
print(" 🌌 Opening VOID AI Assistant Desktop Window")
print("========================================================")

backend_proc = None
frontend_proc = None

def cleanup(sig=None, frame=None):
    print("\n🛑 Closing VOID Assistant window and services...")
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

# 2. Launch Separate Desktop Window
print(f"🖥️ [2/2] Launching {'Web Window' if run_web else 'Native Tauri Application Window'}...")
frontend_proc = subprocess.Popen(frontend_cmd, cwd=DESKTOP_DIR)

if run_web:
    time.sleep(2)
    webbrowser.open("http://localhost:5173")

print("========================================================")
print(" 🟢 VOID AI Assistant Window is active!")
print(" ➜ Backend API: http://127.0.0.1:8000")
print(" ➜ Frontend UI: http://localhost:5173")
print(" 💡 Press Ctrl+C in this terminal to close the window.")
print("========================================================")

try:
    frontend_proc.wait()
except KeyboardInterrupt:
    cleanup()
