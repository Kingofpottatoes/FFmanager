const form= document.getElementById("Theme-input");
const input = document.getElementById("Theme-Name");
const status = document.getElementById("Theme-Name-Error");
let windowId = null
let current_name = null



async function init(){
    const win=await browser.windows.getCurrent()
    windowId=win.id
    current_name= await browser.runtime.sendMessage({action:"get_window_theme",windowId:windowId})
    if (current_name){
        input.placeholder= current_name
    }
    else{
        input.placeholder= "Unnamed"
    }
}

async function onSubmit(event){
    if (windowId === null) {return} //should never happen but, you never know
    event.preventDefault();
    const name = input.value.trim() || current_name || "Unnamed";
    if (name.length===0){
        status.textContent = "Theme name cannot be empty"
        return
    }
    status.textContent = ""
    if (name!==current_name){
        const reply = await browser.runtime.sendMessage({action:"create_theme",windowId:windowId,name:name})
        if (reply.success){
            current_name=name
            input.placeholder= current_name
            input.value=""
        }
        else{
            status.textContent = reply.error
        }
    }   
}

form.addEventListener("submit", onSubmit)
init()