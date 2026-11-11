#!/usr/bin/env python3
import sys
import json
import struct
import traceback
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
from core.themes import (
    THEMES_FOLDER,
    list_themes,
    get_url_from_theme,
    create_theme_file,
    delete_theme_file
)
from ff_open_window import open_new_window
def read_bytes(n,allow_eof=False):#lit les n premiers bytes, avec un safe guard si connexion interrompue
    data=b""
    while len(data)<n:
        chunk = sys.stdin.buffer.read(n - len(data))
        if chunk == b"":
            if allow_eof:
                return None
            raise InterruptedError("Message from Firefox interrupted")
        data+=chunk
    return data
def read_message():
    size_json=read_bytes(4,allow_eof=True)
    if size_json is None:
        return None
    size_json=struct.unpack("<I", size_json)[0]
    if size_json==0:
        return None
    message=read_bytes(size_json)
    if message is None:
        raise RuntimeError("Unexpected EOF")
    try:
        message = json.loads(message)
    except json.JSONDecodeError:
        raise ValueError("incomplet json")
    else:
        return message
def send_message(dic):
    json_message=json.dumps(dic)
    bytes_message=json_message.encode("utf-8")
    message_size=struct.pack("<I",len(bytes_message))
    sys.stdout.buffer.write(message_size+bytes_message)
    sys.stdout.buffer.flush()

def get_action(FF_message):
    args=FF_message["data"] if FF_message["data"] is not None else {}
    if FF_message["action"]=="list_themes":
        return list_themes()
    elif FF_message["action"]=="get_url_from_themes":
        return get_url_from_theme(**args)
    elif FF_message["action"]=="create_theme":
        return create_theme_file(**args)
    elif FF_message["action"]=="delete_theme":
        return delete_theme_file(**args)
    elif FF_message["action"]=="open_theme":
        return open_new_window(THEMES_FOLDER,**args)
    else:
        raise ValueError(f"Unknown action {FF_message["action"]}")
def main():
    while True:
        message=read_message()
        if message is None:
            return
        try:
            
            results=get_action(message)
            response = {
                "id": message["id"],
                "success": True,
                "data": results,
                "error": None
            }
            send_message(response)
        except Exception as e:
            response = {
                "id": message.get("id"),
                "success": False,
                "data": None,
                "error": f"{type(e).__name__}: {e}" #more precise error message
            }
            traceback.print_exc(file=sys.stderr)
            send_message(response)

if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)