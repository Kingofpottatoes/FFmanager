
const connection = connectNative();
const MARKER_PREFIX="about:blank#ffmanager&"
async function get_currents_Tabs() {
    const tabs = await browser.tabs.query({currentWindow:true});
    const results = tabs.map(tab => ({url:tab.url,title:tab.title}))
    return results
}
async function open_theme(windowId,markerTabId,theme_name,supplementary_urls){
    let response={"success":false}
    if (theme_name!=="Unnamed"){
        response=await sendMessage(connection,"get_url_from_theme",{"name":theme_name})
    }
    let urls=[]
    if (response.success){//response from python and theme !=Unnamed
        urls= [...response.data,...supplementary_urls]
    }
    else if (theme_name!=="Unnamed"){//error from python and theme != Unnamed
        console.error(response.error)
        urls=[...supplementary_urls]
    }
    else{//Unnamed case
        urls=[...supplementary_urls]
    }
    let tabs=urls.length
    if (urls.length>0){
        for (const url of urls){
            try{
                await browser.tabs.create({windowId: windowId, url: url})
            }
            catch (e){
                console.error(e)
                tabs=tabs-1
            }
        }    
    }
    if (tabs===0){
        await browser.tabs.create({windowId: windowId})
    }
    await browser.tabs.remove(markerTabId) //clean the window
    
}
async function createTheme(connection,name){
    const tabs= await get_currents_Tabs()
    return await sendMessage(connection,"create_theme",{"name":name,"tabs":tabs})
}
function get_mark(tabId,changeInfo,tab){
    if (!changeInfo.url.startsWith(MARKER_PREFIX)){return}
    const params = new URLSearchParams(changeInfo.url.slice(MARKER_PREFIX.length));
    const theme_name=params.get("theme")
    const urls=params.getAll("url")
    open_theme(tab.windowId,tabId,theme_name,urls)
}
browser.tabs.onUpdated.addListener(get_mark,{ properties: ["url"] });
async function test(){

}