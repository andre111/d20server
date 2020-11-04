Events = {
    _listeners: {},
    
    on: function(name, listener) {
        if(!Events._listeners[name]) Events._listeners[name] = [];
        
        Events._listeners[name].push(listener);
    },
    
    trigger: function(name, data) {
        var listeners = Events._listeners[name];
        if(!listeners) return;
        
        for(const listener of listeners) {
            listener(data);
        }
    }
};
