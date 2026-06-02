#!/usr/bin/env bash

set -e

echo "=================================================="
echo "         Ollama & Model Installation              "
echo "=================================================="

# 1. Install Ollama
echo "Installing Ollama (official curl script)..."
curl -fsSL https://ollama.com/install.sh | sh

echo "Ollama installed successfully."
echo "Starting Ollama service in the background (if not already running)..."

# Ensure Ollama is running so we can pull models
OLLAMA_STARTED=false
if ! pgrep -x "ollama" > /dev/null; then
    ollama serve >/dev/null 2>&1 &
    OLLAMA_PID=$!
    OLLAMA_STARTED=true
    sleep 3
fi

# 2. Detect hardware via Python
echo "Detecting hardware (VRAM/RAM) via Python..."

cat << 'EOF' > detect_vram.py
import subprocess
import os

def get_vram():
    # 1. Try nvidia-smi (reliable for Nvidia dGPUs)
    try:
        out = subprocess.check_output(['nvidia-smi', '--query-gpu=memory.total', '--format=csv,noheader,nounits'], text=True)
        return float(out.strip().split('\n')[0]) / 1024
    except Exception:
        pass
    
    # 2. Try AMD sysfs (for AMD dGPUs/APUs)
    try:
        with open('/sys/class/drm/card0/device/mem_info_vram_total', 'r') as f:
            return int(f.read().strip()) / (1024**3)
    except Exception:
        pass
        
    # 3. Fallback to CPU RAM heuristic for integrated GPUs
    try:
        # Use simple os tools if psutil is unavailable to avoid pip installs
        mem_bytes = os.sysconf('SC_PAGE_SIZE') * os.sysconf('SC_PHYS_PAGES')
        ram_gb = mem_bytes / (1024**3)
        return 2.0 if ram_gb >= 16 else 1.0
    except Exception:
        return 1.0 # Absolute fallback

vram = get_vram()
print(f"DETECTED_VRAM={vram:.1f}")
if vram >= 6.0:
    print("SELECTED_MODEL=lfm2.5:latest")
elif vram >= 2.0:
    print("SELECTED_MODEL=granite4.1:3b")
else:
    print("SELECTED_MODEL=lfm2.5-thinking:latest")
EOF

# Run python script and parse outputs safely
PYTHON_OUT=$(python3 detect_vram.py)
rm detect_vram.py

VRAM=$(echo "$PYTHON_OUT" | grep DETECTED_VRAM | cut -d'=' -f2)
MODEL=$(echo "$PYTHON_OUT" | grep SELECTED_MODEL | cut -d'=' -f2)

echo "Detected VRAM: ~${VRAM} GB"
echo "Selected Model based on hardware: $MODEL"

echo "Pulling $MODEL from Ollama..."
ollama pull "$MODEL"

echo "Aliasing $MODEL to 'ENMA' for the agent..."
ollama cp "$MODEL" ENMA

echo "=================================================="
echo "Model Setup Complete! You can now run the ENMA Agent."
echo "=================================================="

# Stop the background ollama if we started it here
if [ "$OLLAMA_STARTED" = true ]; then
    kill $OLLAMA_PID
fi
