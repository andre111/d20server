Connection = {
    _ws: null,
    
    init: function(callback, closecallback) {
        Connection._ws = new WebSocket("ws://" + location.host + "/ws");
        Connection._ws.onopen = callback;
        Connection._ws.onmessage = Connection.read;
        Connection._ws.onclose = closecallback;
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
