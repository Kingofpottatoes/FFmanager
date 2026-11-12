const connection = connectNative();
const MARKER_PREFIX="about:blank#ffmanager&"
const window_theme= new Map()
const window_timers = new Map()
async function get_currents_Tabs(windowId) {
    const tabs = await browser.tabs.query({ windowId: windowId });
    const results = tabs.map(tab => ({url:tab.url,title:tab.title,pinned:tab.pinned}))
    return results
}
async function open_theme(windowId,markerTabId,theme_name,supplementary_urls){
    let theme_tabs=[]
    if (theme_name!=="Unnamed"){
        const response=await sendMessage(connection,"get_tabs_from_theme",{"name":theme_name})
        if (!response.success){//python error
            console.error(response.error)
        }
        else {theme_tabs=response.data}
    }
    for (const url of supplementary_urls){
        theme_tabs.push({url:url,title:url,pinned:false})
    }
    let n_tabs=theme_tabs.length
    for (const t of theme_tabs){
            try{
                await browser.tabs.create({windowId: windowId, url: t.url,discarded:true,active:false,title:t.title,pinned:t.pinned})
            }
            catch (e){
                console.error(e)
                n_tabs=n_tabs-1
            }
    }
    if (n_tabs===0){
        await browser.tabs.create({windowId: windowId})
    }
    if (theme_name!=="Unnamed" && ![...window_theme.values()].includes(theme_name)){
        window_theme.set(windowId,theme_name)
        browser.browserAction.setIcon({ path: "icons/tab_group.svg", windowId: windowId })
        browser.browserAction.setTitle({ title: "FFManager : " + theme_name, windowId: windowId })
    }
    await browser.tabs.remove(markerTabId) //clean the window
}
async function createTheme(windowId,name){
    clearTimeout(window_timers.get(windowId))
    window_timers.delete(windowId)
    const tabs= await get_currents_Tabs(windowId)
    const result = await sendMessage(connection,"create_theme",{"name":name,"tabs":tabs})
    const old_name=window_theme.get(windowId)
    if (result.success){
        if (old_name && old_name!==name){
            const delete_result = await sendMessage(connection,"delete_theme",{"theme_name":old_name})
            if (!delete_result.success){
                console.error(delete_result.error)
            }
        }

        window_theme.set(windowId,name)
        browser.browserAction.setIcon({ path: "icons/tab_group.svg", windowId: windowId })
        browser.browserAction.setTitle({ title: "FFManager : " + name, windowId: windowId })
    }
    return result
}

function get_mark(tabId,changeInfo,tab){
    if (!changeInfo.url.startsWith(MARKER_PREFIX)){return}
    const params = new URLSearchParams(changeInfo.url.slice(MARKER_PREFIX.length));
    const theme_name=params.get("theme")
    const urls=params.getAll("url")
    open_theme(tab.windowId,tabId,theme_name,urls)
}
async function save(windowId){
    if (!window_theme.has(windowId)) return //should never happen but, you never know
    const tabs=await get_currents_Tabs(windowId)
    const response =await sendMessage(connection,"create_theme",{"name":window_theme.get(windowId),"tabs":tabs,"replace":true})
    if (!response.success){
        console.error(response.error)
    }
}
function rewrite(windowId){
    if (window_timers.has(windowId)){
        clearTimeout(window_timers.get(windowId))
    }
    const timer_id=setTimeout(()=>save(windowId),1000)
    window_timers.set(windowId,timer_id)
}
function on_created(tab){
    if (!window_theme.has(tab.windowId)){return}
    rewrite(tab.windowId)

}
function on_removed(Tabid,windowInfo){
    if (!window_theme.has(windowInfo.windowId)){return}
    if (!windowInfo.isWindowClosing){
        rewrite(windowInfo.windowId)
    }
}
function on_updated(TabId,changeInfo,tab){
    if (!window_theme.has(tab.windowId)){return}
    rewrite(tab.windowId)
}
function on_moved(tabId,windowInfo){
    if (!window_theme.has(windowInfo.windowId)){return}
    rewrite(windowInfo.windowId)

}
function on_attached(Tabid,removeinfo){
    if (!window_theme.has(removeinfo.newWindowId)){return}
    rewrite(removeinfo.newWindowId)
}
function on_detached(Tabid,removeinfo){
    if (!window_theme.has(removeinfo.oldWindowId)){return}
    rewrite(removeinfo.oldWindowId)
}
function on_window_removed(windowId){
    window_theme.delete(windowId)
    if (window_timers.has(windowId)){
        clearTimeout(window_timers.get(windowId))
        window_timers.delete(windowId)
    }
}

browser.tabs.onUpdated.addListener(get_mark,{ properties: ["url"] });

//listener to update themes
browser.tabs.onCreated.addListener(on_created)
browser.tabs.onRemoved.addListener(on_removed)
browser.tabs.onUpdated.addListener(on_updated,{ properties: ["url", "title", "pinned"] })
browser.tabs.onMoved.addListener(on_moved)
browser.tabs.onAttached.addListener(on_attached)
browser.tabs.onDetached.addListener(on_detached)
browser.windows.onRemoved.addListener(on_window_removed)

async function handle_popup_message(message, sender){
    if (message.action === "get_window_theme"){
        return window_theme.get(message.windowId) ?? null
    }
    if (message.action === "create_theme"){
        return await createTheme(message.windowId,message.name)
    }
}
browser.runtime.onMessage.addListener(handle_popup_message)