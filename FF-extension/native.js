function connectNative(){
    const port = browser.runtime.connectNative("ffmanager");
    const pendingRequests = {

    }
    let request_id=0
    port.onDisconnect.addListener(() => {
        const error = new Error(
            browser.runtime.lastError?.message || "Native Host disconnected"
        );

        for (const id in pendingRequests) {
            pendingRequests[id].reject(error);
            delete pendingRequests[id];
        }
    });
    port.onMessage.addListener((message) => {
        const request =pendingRequests[message.id]
        if (request) {
            request.resolve(message)
            delete pendingRequests[message.id]
        }
    });

    return {
        port,
        pendingRequests,
        getNextID:()=>++request_id
    }
}
function sendMessage(connection,action,data){
    const id=connection.getNextID();
    return new Promise((resolve,reject) =>{
        connection.pendingRequests[id] = {
            resolve: resolve,
            reject: reject
        };
        try{
            connection.port.postMessage({
                id:id,
                action: action,
                data: data
            });
    } catch (error) {
        delete connection.pendingRequests[id];
        reject(error)
    }
    });
}