#!/usr/bin/env bash

# ==============================================================================
# VOID AI Assistant — Unified Desktop Window Launcher
# Runs FastAPI Backend (Port 8000) and opens VOID in a separate Desktop Window.
# ==============================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/apps/backend"
DESKTOP_DIR="$ROOT_DIR/apps/desktop"

# Web mode flag check (--web or -w)
RUN_WEB=false
if [[ "$1" == "--web" || "$1" == "-w" ]]; then
  RUN_WEB=true
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
echo " 🌌 Opening VOID AI Assistant Desktop Window "
echo "========================================================"

# Trap SIGINT (Ctrl+C) and SIGTERM to kill all child processes cleanly
cleanup() {
  echo ""
  echo "🛑 Closing VOID Assistant window and services..."
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

# Wait for backend readiness
echo "⏳ Waiting for backend API readiness..."
for i in {1..15}; do
  if curl -s http://127.0.0.1:8000/ > /dev/null 2>&1; then
    echo "✅ Backend API is ready!"
    break
  fi
  sleep 0.8
done

# 2. Launch Separate App Window
cd "$DESKTOP_DIR" || exit 1

if [ "$RUN_WEB" = true ]; then
  echo "🚀 [2/2] Opening Web App Window..."
  $PM_DEV &
  FRONTEND_PID=$!
  sleep 2
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:5173" 2>/dev/null &
  fi
else
  echo "🖥️ [2/2] Launching Native Tauri Desktop Application Window..."
  $PM_TAURI &
  FRONTEND_PID=$!
  
  # Optional fallback if tauri fails to start after 5 seconds: auto open browser window
  (
    sleep 6
    if ! curl -s http://localhost:5173/ > /dev/null 2>&1; then
      echo "🌐 Opening web app window fallback..."
      $PM_DEV --open &
    fi
  ) &
fi

echo "========================================================"
echo " 🟢 VOID AI Assistant Window is active! "
echo " ➜ Backend API: http://127.0.0.1:8000 "
echo " ➜ Frontend UI: http://localhost:5173 "
echo " 💡 Press Ctrl+C in this terminal to close the window. "
echo "========================================================"

wait
