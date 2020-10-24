Connection = {
    _ws: null,
    
    init: function(callback) {
        Connection._ws = new WebSocket("ws://" + location.host + "/ws");
        Connection._ws.onopen = callback;
        Connection._ws.onmessage = Connection.read;
    },
    
    close: function() {
        Connection._ws.close();
    },
    
    send: function(msg) {
        Connection._ws.send(JSON.stringify(msg));
    },
    
    read: function(evt) {
        var msg = JSON.parse(evt.data);
        MessageService.recieve(msg);
    }
}
