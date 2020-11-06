Events = {
    _listeners: {},
    
    on: function(name, listener) {
        if(!Events._listeners[name]) Events._listeners[name] = [];
        
        Events._listeners[name].push(listener);
    },
    
    remove: function(name, listener) {
        if(!Events._listeners[name]) return;
        
        var index = Events._listeners[name].indexOf(listener);
        if(index >= 0) Events._listeners[name].slice(index, 1);
    },
    
    trigger: function(name, data) {
        var listeners = Events._listeners[name];
        if(!listeners) return;
        
        for(const listener of listeners) {
            listener(data);
        }
    }
};
