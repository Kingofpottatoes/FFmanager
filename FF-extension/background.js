let nativePort = null;

function connectNative() {
    nativePort = browser.runtime.connectNative("ffmanager");

    nativePort.onMessage.addListener((message) => {
        console.log("[FFManager] Message reçu :", message);
    });

    nativePort.onDisconnect.addListener(() => {
        console.error(
            "[FFManager] Déconnexion :",
            browser.runtime.lastError
        );

        nativePort = null;
    });
}

connectNative();
