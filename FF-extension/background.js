
const connection = connectNative();

async function getTabs() {
    const tabs = await browser.tabs.query({currentWindow:true});
    const results = tabs.map(tab => ({url:tab.url,title:tab.title}))
    return results
}

async function createTheme(connection,name){
    const tabs= await getTabs()
    return await sendMessage(connection,"create_theme",{"name":name,"tabs":tabs})
}