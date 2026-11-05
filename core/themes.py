import json
import re
from pathlib import Path

THEMES_FOLDER = Path.home() / ".local" / "share" / "ff-manager"
THEMES_FOLDER.mkdir(parents=True, exist_ok=True)

def is_valid_name(name):
    return re.fullmatch(r"[\w-]+", name)

def list_themes():

    if not THEMES_FOLDER.is_dir():
        return []
    themes_names=THEMES_FOLDER.glob("*.json")
    themes_names=[name.stem for name in themes_names if is_valid_name(name.stem)]
    return sorted(themes_names)

def get_url_from_theme(name):
    if not is_valid_name(name):
        raise ValueError("Invalid theme name")
    theme_path=THEMES_FOLDER/(name+".json")

    with theme_path.open() as f:
        theme=json.load(f)
        theme_tabs=theme["tabs"]
        urls= [theme_tabs[i]["url"] for i in range(0,len(theme_tabs)) if theme_tabs[i]["url"].startswith(("http://", "https://"))]
    return urls
#delete or create theme file
def delete_theme_file(theme_name):
    if not is_valid_name(theme_name):
        raise ValueError("Invalid theme name")
    theme_path=THEMES_FOLDER/(theme_name+".json")
    theme_path.unlink(missing_ok=True)
def create_theme_file(name,urls):
    if not is_valid_name(name):
        raise ValueError("Invalid theme name")
    theme_path=THEMES_FOLDER/(name+".json")
    if theme_path.exists():
        raise FileExistsError(f"Theme {name} already exists")
    data={
        "name":name,
        "tabs":[{"url":urls[i],"title":"TODO","pinned":False} for i in range(0,len(urls))]
    }
    with theme_path.open("w", encoding="utf-8") as f:
        json.dump(data,f,indent=4)