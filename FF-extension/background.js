const connection = connectNative();
const MARKER_PREFIX="about:blank#ffmanager&"
const window_theme= new Map()
async function get_currents_Tabs(windowId) {
    const tabs = await browser.tabs.query({ windowId: windowId });
    const results = tabs.map(tab => ({url:tab.url,title:tab.title,pinned:tab.pinned}))
    return results
}
async function open_theme(windowId,markerTabId,theme_name,supplementary_urls){
    let theme_tabs=[]
        const response=await sendMessage(connection,"get_tabs_from_theme",{"name":theme_name})
        if (!response.success){//python error
            console.error(response.error)
        }
        else {theme_tabs=response.data}
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
    if (theme_name!=="Unnamed"){
        window_theme.set(windowId,theme_name)
    }
    await browser.tabs.remove(markerTabId) //clean the window
}
async function createTheme(connection,name){
    const win = await browser.windows.getCurrent()
    const tabs= await get_currents_Tabs(win.id)
    result = await sendMessage(connection,"create_theme",{"name":name,"tabs":tabs})
    if (result.success){
        window_theme.set(win.id,name)
    }
}
function get_mark(tabId,changeInfo,tab){
    if (!changeInfo.url.startsWith(MARKER_PREFIX)){return}
    const params = new URLSearchParams(changeInfo.url.slice(MARKER_PREFIX.length));
    const theme_name=params.get("theme")
    const urls=params.getAll("url")
    open_theme(tab.windowId,tabId,theme_name,urls)
}
async function rewrite(windowId){
    const tabs=await get_currents_Tabs(windowId)
    const response =await sendMessage(connection,"create_theme",{"name":window_theme.get(windowId),"tabs":tabs,"replace":true})
    if (!response.success){
        console.error(response.error)
    }
}
function on_created(tab){
    if (!window_theme.has(tab.windowId)){return}
    result = rewrite(tab.windowId)

}
function on_removed(Tabid,windowInfo){
    if (!window_theme.has(windowInfo.windowId)){return}
    if (!windowInfo.isWindowClosing){
        result = rewrite(windowInfo.windowId)
    }
}
function on_updated(TabId,changeInfo,tab){
    if (!window_theme.has(tab.windowId)){return}
    result = rewrite(tab.windowId)
}
function on_moved(tabId,windowInfo){
    if (!window_theme.has(windowInfo.windowId)){return}
    result = rewrite(windowInfo.windowId)

}
function on_attached(Tabid,removeinfo){
    if (!window_theme.has(removeinfo.newWindowId)){return}
    result = rewrite(removeinfo.newWindowId)
}
function on_detached(Tabid,removeinfo){
    if (!window_theme.has(removeinfo.oldWindowId)){return}
    result = rewrite(removeinfo.oldWindowId)
}
function on_window_removed(windowId){
    window_theme.delete(windowId)
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
