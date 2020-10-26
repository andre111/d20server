StateInit = {
    init: function() {
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
