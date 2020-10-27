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
        setState(StateInit);
    }
}
