StateInit = {
    init: function() {
        document.body.innerHTML = "Connecting to server...";
        Connection.init(StateInit.onConnect, StateInit.onClose);
        ImageService.init();
    },
    
    exit: function() {
    },
    
    onConnect: function() {
        document.body.innerHTML = "";
        setState(StateSignIn);
    },
    
    onClose: function() {
        // do NOT go back to StateInit, as old event listeners and other stuff could remain 
        // -> ask for manualy full page reload
        setState(StateDisconnected);
    }
}
