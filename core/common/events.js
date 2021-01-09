const EventListeners = {};

export const Events = {
    on: function(name, listener) {
        if(!EventListeners[name]) EventListeners[name] = [];

        EventListeners[name].push(listener);
    },

    remove: function(name, listener) {
        if(!EventListeners[name]) return;
        
        const index = EventListeners[name].indexOf(listener);
        if(index >= 0) EventListeners[name].slice(index, 1);
    },

    trigger: function(name, data) {
        const listeners = EventListeners[name];
        if(!listeners) return;

        for(const listener of listeners) {
            listener(data);
        }
    }
}
