
const connection = connectNative();
const MARKER_PREFIX="about:blank#ffmanager&"
async function getTabs() {
    const tabs = await browser.tabs.query({currentWindow:true});
    const results = tabs.map(tab => ({url:tab.url,title:tab.title}))
    return results
}

async function createTheme(connection,name){
    const tabs= await getTabs()
    return await sendMessage(connection,"create_theme",{"name":name,"tabs":tabs})
}
function get_mark(tabId,changeInfo,tab){
    if (!changeInfo.url.startsWith(MARKER_PREFIX)){return}
    const params = new URLSearchParams(changeInfo.url.slice(MARKER_PREFIX.length));
    const theme_name=params.get("theme")
    const urls=params.getAll("url")
    console.log(theme_name,urls)
}
browser.tabs.onUpdated.addListener(get_mark,{ properties: ["url"] });