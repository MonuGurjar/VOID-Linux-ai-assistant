#!/usr/bin/env bash

set -e

# Change this to your actual GitHub repo URL once published
REPO_URL="https://github.com/MonuGurjar/ENMA-Linux-ai-assistant.git"
INSTALL_DIR="$HOME/ENMA-Linux-ai-assistant"

echo "=================================================="
echo "    ENMA - Evolving Neural Monitoring Agent       "
echo "               Installation Script                "
echo "=================================================="

# 1. Clone or update the repository
if [ -d "$INSTALL_DIR" ]; then
    echo "Directory $INSTALL_DIR already exists. Updating..."
    cd "$INSTALL_DIR"
    git pull origin main || true
else
    echo "Cloning ENMA into $INSTALL_DIR..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# 2. Detect environment managers
echo ""
echo "Detecting Python environment managers..."

HAS_UV=false
HAS_MISE=false
HAS_PYENV=false
HAS_PYTHON3=false

if command -v uv &> /dev/null; then HAS_UV=true; fi
if command -v mise &> /dev/null; then HAS_MISE=true; fi
if command -v pyenv &> /dev/null; then HAS_PYENV=true; fi
if command -v python3 &> /dev/null; then HAS_PYTHON3=true; fi

options=()
$HAS_UV && options+=("uv (Recommended)")
$HAS_MISE && options+=("mise")
$HAS_PYENV && options+=("pyenv")
$HAS_PYTHON3 && options+=("python3 (Standard venv)")

if [ ${#options[@]} -eq 0 ]; then
    echo "Error: No supported Python environments found. Please install python3, uv, mise, or pyenv."
    exit 1
fi

echo "Select your preferred Python manager for ENMA setup:"
PS3="Enter choice (1-${#options[@]}): "
select opt in "${options[@]}"; do
    case $opt in
        "uv (Recommended)")
            echo "Setting up with uv..."
            uv venv
            uv sync
            break
            ;;
        "mise")
            echo "Setting up with mise..."
            mise use python@3.11
            python3 -m venv .venv
            source .venv/bin/activate
            pip install -r requirements.txt
            break
            ;;
        "pyenv")
            echo "Setting up with pyenv..."
            pyenv install -s 3.11
            pyenv local 3.11
            python3 -m venv .venv
            source .venv/bin/activate
            pip install -r requirements.txt
            break
            ;;
        "python3 (Standard venv)")
            echo "Setting up with standard python3 venv..."
            python3 -m venv .venv
            source .venv/bin/activate
            pip install -r requirements.txt
            break
            ;;
        *) echo "Invalid option $REPLY";;
    esac
done

echo ""
echo "Installing Desktop Shortcut..."
mkdir -p "$HOME/.local/share/applications"
DESKTOP_FILE="$HOME/.local/share/applications/enma.desktop"
cp "$INSTALL_DIR/assets/enma.desktop" "$DESKTOP_FILE"

if [[ "$opt" == *"uv"* ]]; then
    EXEC_CMD="$INSTALL_DIR/.venv/bin/python $INSTALL_DIR/app.py"
else
    EXEC_CMD="$INSTALL_DIR/.venv/bin/python $INSTALL_DIR/app.py"
fi
ICON_CMD="$INSTALL_DIR/assets/icon.svg"

sed -i "s|{{EXEC_PATH}}|$EXEC_CMD|g" "$DESKTOP_FILE"
sed -i "s|{{ICON_PATH}}|$ICON_CMD|g" "$DESKTOP_FILE"
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database "$HOME/.local/share/applications" || true
fi
echo "Shortcut created at $DESKTOP_FILE"

echo ""
echo "=================================================="
echo "Installation complete!"
echo "To run ENMA:"
echo "  cd $INSTALL_DIR"
if [[ "$opt" == *"uv"* ]]; then
    echo "  uv run python app.py"
else
    echo "  source .venv/bin/activate"
    echo "  python app.py"
fi
echo "=================================================="
