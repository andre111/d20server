import { EventListener } from './event-listener.js';
import { Event } from './event.js';

const EventListeners = {};
export const Events = {
    on: function(name, callback, recieveCanceled = false, priority = 0) {
        if(!EventListeners[name]) EventListeners[name] = [];

        const listener = new EventListener(callback, recieveCanceled, priority);
        EventListeners[name].push(listener);
        EventListeners[name].sort((a, b) => a.priority - b.priority);
        return listener;
    },

    remove: function(name, listener) {
        if(!EventListeners[name]) return;
        
        const index = EventListeners[name].indexOf(listener);
        if(index >= 0) EventListeners[name].slice(index, 1);
    },

    trigger: function(name, data, cancelable = false) {
        const event = new Event(data, cancelable);

        const listeners = EventListeners[name];
        if(!listeners) return;

        for(const listener of listeners) {
            if(!event.isCanceled || listener.recieveCanceled) {
                listener.callback(event);
            }
        }

        return event;
    }
}
