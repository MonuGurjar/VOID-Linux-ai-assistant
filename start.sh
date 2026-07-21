#!/usr/bin/env bash

# ==============================================================================
# VOID AI Assistant — Unified Service Launcher
# Runs FastAPI Backend (Port 8000) and Desktop Frontend concurrently with 1 command.
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/apps/backend"
DESKTOP_DIR="$ROOT_DIR/apps/desktop"

# Check if Tauri mode requested (--tauri or -t)
RUN_TAURI=false
if [[ "$1" == "--tauri" || "$1" == "-t" ]]; then
  RUN_TAURI=true
fi

# Detect Node Package Manager
if command -v pnpm >/dev/null 2>&1; then
  PM_DEV="pnpm dev"
  PM_TAURI="pnpm tauri dev"
elif command -v npx >/dev/null 2>&1; then
  PM_DEV="npx pnpm dev"
  PM_TAURI="npx pnpm tauri dev"
elif command -v npm >/dev/null 2>&1; then
  PM_DEV="npm run dev"
  PM_TAURI="npm run tauri -- dev"
else
  echo "❌ Error: No Node.js package manager (pnpm/npx/npm) found in PATH."
  exit 1
fi

echo "========================================================"
echo " 🌌 Launching VOID AI Assistant Services "
echo "========================================================"

# Trap SIGINT (Ctrl+C) and SIGTERM to kill all child processes cleanly
cleanup() {
  echo ""
  echo "🛑 Stopping VOID Assistant processes..."
  if [ -n "$BACKEND_PID" ]; then
    kill "$BACKEND_PID" 2>/dev/null
  fi
  if [ -n "$FRONTEND_PID" ]; then
    kill "$FRONTEND_PID" 2>/dev/null
  fi
  echo "✨ All services stopped cleanly."
  exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 1. Start FastAPI Backend
echo "⚡ [1/2] Starting FastAPI Backend on http://127.0.0.1:8000..."
cd "$BACKEND_DIR" || exit 1
uv run uvicorn src.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend API readiness..."
for i in {1..15}; do
  if curl -s http://127.0.0.1:8000/ > /dev/null 2>&1; then
    echo "✅ Backend API is ready!"
    break
  fi
  sleep 0.8
done

# 2. Start Frontend App
cd "$DESKTOP_DIR" || exit 1

if [ "$RUN_TAURI" = true ]; then
  echo "🚀 [2/2] Launching Tauri Desktop Window..."
  $PM_TAURI &
  FRONTEND_PID=$!
else
  echo "🚀 [2/2] Launching Frontend Interface..."
  $PM_DEV &
  FRONTEND_PID=$!
fi

echo "========================================================"
echo " 🟢 VOID AI Assistant is running! "
echo " ➜ Backend API: http://127.0.0.1:8000 "
echo " ➜ Frontend UI: http://localhost:5173 "
echo " 💡 Press Ctrl+C anytime to stop all services. "
echo "========================================================"

# Keep script alive and wait for child processes
wait
