import json
import subprocess
import time

def read_hypr(*args):
    result = subprocess.run(["hyprctl",*args, "-j",], capture_output=True, text=True)

    if result.returncode!=0:
        raise ValueError(f"hyprctl error: {result.stderr}")
    
    all_ws=json.loads(result.stdout)
    return all_ws

def occupied_ws(special):

    all_ws = read_hypr("workspaces")

    occupied=set()
    for workspace in all_ws:
        if not special:
            if workspace["windows"]>0 and workspace["id"]>0:
                occupied.add(workspace["id"])
        else:
            if workspace["windows"]>0 and workspace["name"].startswith("special:") and workspace["name"][8:len(workspace["name"])].isdigit() :#max : special:99
                occupied.add(int(workspace["name"][8:len(workspace["name"])])) #on recupere le nombre depuis le nom "ON ASSUME QUE LES NOMS SONT TOUS SOUT FORMAT : special:i"
    return occupied

def first_unoccupied(start,occupied,limit):
    for i in range(start,limit+1):
        if i not in occupied:
            return i
    return start
    
def window_addresses():
    all_windows = read_hypr("clients")
    adresses=set()
    for window in all_windows:
       adresses.add(window["address"])
    return adresses

def get_new_window_address(addresses,timeout):
    start=time.monotonic()
    while time.monotonic()-start<timeout:
        windows=read_hypr("clients")
        new_window_address=[w["address"] for w in windows if w["address"] not in addresses and w["class"]=="firefox"]
        if len(new_window_address)>0:
            return new_window_address
        time.sleep(0.1)
    raise TimeoutError(f"new firefox window took more than {timeout}s to open")

def move_window(address,workspace):
    lua_cmd = f'hl.dsp.window.move({{ workspace = "{workspace}", window = "address:{address}" }})'
    r = subprocess.run(["hyprctl","dispatch",lua_cmd], capture_output=True, text=True)
    if not r.returncode==0:
        raise ValueError("hyprctl error")
    check=read_hypr("clients")
    for client in check:
        if client["address"]==address:
            if client["workspace"]["name"]==workspace:
                return 0
            else:
                raise RuntimeError("window didnt move")
    raise RuntimeError("window disapeared")