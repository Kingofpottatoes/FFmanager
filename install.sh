#!/usr/bin/env bash
set -euo pipefail

# --- paths ---
SCRIPT_DIR="$(dirname "$(realpath "$0")")"
INSTALL_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/ffmanager/host"
HOST_PATH="$INSTALL_DIR/ffmanager_host.py"
MANIFEST_DIRS=(
    "$HOME/.mozilla/native-messaging-hosts"
    "${XDG_CONFIG_HOME:-$HOME/.config}/mozilla/native-messaging-hosts"
)
case "${1:-}" in
    --uninstall)
        echo "Uninstalling ffmanager host..."
        rm -rf "$INSTALL_DIR"
        for dir in "${MANIFEST_DIRS[@]}"; do
            rm -f "$dir/ffmanager.json"
        done
        echo "Uninstalled."
        exit 0
        ;;
    "")
        # no arguments, continue with installation
        # --- checks ---
        # python3 present?
        if ! command -v python3 &> /dev/null; then
            echo "python3 could not be found" >&2
            exit 1
        fi
        # --- install host ---
        # copy native/ffmanager_host.py + core/ into INSTALL_DIR, chmod +x
        rm -rf "$INSTALL_DIR"
        mkdir -p "$INSTALL_DIR"
        cp -r "$SCRIPT_DIR/native/ffmanager_host.py" "$SCRIPT_DIR/core" "$INSTALL_DIR"
        chmod +x "$INSTALL_DIR/ffmanager_host.py"
        rm -rf "$INSTALL_DIR/core/__pycache__" #delete pycache
        # --- generate manifest ---
        # MANIFEST_DIRS: where Firefox looks for the json
        for dir in "${MANIFEST_DIRS[@]}"; do
            mkdir -p "$dir"
            rm -f "$dir/ffmanager.json"
            # replace @HOST_PATH@ in the template, write into each MANIFEST_DIR
            sed "s|@HOST_PATH@|$HOST_PATH|" "$SCRIPT_DIR/native/ffmanager.json.in" > "$dir/ffmanager.json"
        done
        # --- done ---
        # print what was installed where
        echo "Installed ffmanager scripts to $INSTALL_DIR"
        echo "manifest installed to:"
        for dir in "${MANIFEST_DIRS[@]}"; do
            echo "  $dir/ffmanager.json"
        done
        ;;
    *)
        echo "usage: $0 [--uninstall]" >&2
        exit 1
        ;;
esac
