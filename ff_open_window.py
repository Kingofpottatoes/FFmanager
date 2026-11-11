import subprocess
import sys
import json
from core.hyprland import (
    first_unoccupied,
    occupied_ws,
    window_addresses,
    get_new_window_address,
    move_window
)

from core.themes import (
    is_valid_name,
    list_themes,
    get_url_from_theme,
    delete_theme_file,
    create_theme_file,
    THEMES_FOLDER
)



def launch_firefox(urls):
    if len(urls)<1:
        raise ValueError("pas d'url")
    elif len(urls)==1:
        subprocess.Popen(["firefox","--new-window"]+urls,stdin=subprocess.DEVNULL,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True)
    else:
        subprocess.Popen(["firefox"]+urls,stdin=subprocess.DEVNULL,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,start_new_session=True)




def open_new_window(themes_path,name="",supplementary_urls=None,workspace_destination=None,special=True):
    if supplementary_urls==None:
        supplementary_urls=[]
    if workspace_destination==None:
        target_ws="special:"+str(first_unoccupied(1,occupied_ws(True),99))
    elif special :
        target_ws="special:"+workspace_destination
    else:
        target_ws=workspace_destination
    currents_windows=window_addresses()
    if name!="":
        urls=get_url_from_theme(name)+supplementary_urls
    else:
        urls=supplementary_urls
    launch_firefox(urls)
    address_firefox=get_new_window_address(currents_windows,5)
    move_window(address_firefox[0],target_ws)



def help():
    return "utulisations:\n python ff_window.py --theme-name NOM_THEME --urls URL1 URL2 URL3... --wokspace WORKSPACE_DESTINATION \n python ff_window.py --list \n python ff_window.py --list-theme-urls THEME_NAME"

def main():
    themes_path=THEMES_FOLDER
    themes_path.mkdir(parents=True, exist_ok=True)
    args=sys.argv[1:]
    current_option=None
    theme_name=""
    suppelementary_urls=[]
    workspace_destination=None
    special=False
    delete=False
    create=False
    if args and args[0]=="--list":
        if len(args) != 1:
            print(help(), file=sys.stderr)
            return 2

        print(json.dumps(list_themes()))
        return 0
    if args and args[0] == "--list-theme-urls":
        if len(args) != 2:
            print(help(), file=sys.stderr)
            return 2

        print(json.dumps(get_url_from_theme(args[1])))
        return 0
    for arg in args:
        if arg.startswith("--"):
            if arg not in ("--theme-name", "--urls", "--workspace","--special","--delete","--create-theme"):
                print(help(), file=sys.stderr)
                return 2
            if arg == "--special":
                special = True
                current_option = None
                continue
            if arg =="--delete":
                delete=True                
                current_option = None
                continue
            if arg=="--create-theme":
                create=True
                current_option=None
                continue
            current_option = arg
            continue
        if current_option=="--theme-name":
            theme_name=arg #supress the other theme name to keep only the last one
        elif current_option=="--urls":
            suppelementary_urls.append(arg)
        elif current_option=="--workspace":
            workspace_destination=arg#also suppress the other workspace_destination to keep only the last one
        else:
            print(help(), file=sys.stderr)
            return 2
    if create and delete:
        raise ValueError("Cannot create and delete a theme simultaneously")
    if delete:
        if not is_valid_name(theme_name):
            raise ValueError(f"{theme_name} is not a valid name")
        delete_theme_file(theme_name)
    elif create:
        if not is_valid_name(theme_name):
            raise ValueError(f"{theme_name} is not a valid name")
        create_theme_file(theme_name,[{"url":url,"title":url,"pinned":False } for url in suppelementary_urls])#we use supplementary urk even if we should create a var new_theme_url but i dont care, it work and dont break anything
        print(json.dumps({"success": True}))
    else:
        open_new_window(
            themes_path,
            name=theme_name,
            supplementary_urls=suppelementary_urls,
            workspace_destination=workspace_destination,
            special=special
        )

    return 0
if __name__ == "__main__":
    import traceback

    try:
        sys.exit(main())
    except Exception:
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)