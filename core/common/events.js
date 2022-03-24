import { EventListener } from './event-listener.js';
import { Event } from './event.js';

/**
 * Provides static methods for handling events with custom data.
 * Supports adding and removing listeners with custom priority.
 * Triggered events can carry custom data and optionally be 'cancelable'.
 */
export class Events {
    /**
     * @type {Object<string, Array<EventListener>>}
     */
    static #listeners = {};

    /**
     * Registers a new {@link EventListener} to the named event using the provided callback.
     * Optionally allows setting of priority for ordering and enabling processing of canceled events.
     * @param {string} name name of the event to listen to
     * @param {EventCallback} callback the {@link EventCallback} to use
     * @param {boolean} recieveCanceled should this listener recieve events that have already been canceled by earlier listeners, defaults to false
     * @param {number} priority the priority, listeners with higher priority will be called first, defaults to 0
     * @returns {EventListener} the newly created {@link EventListener} object
     */
    static on(name, callback, recieveCanceled = false, priority = 0) {
        if (typeof name !== 'string') throw new Error('name is not a string');
        if (callback === null || callback === undefined) throw new Error('callback cannot be null/undefined');

        if (!Events.#listeners[name]) Events.#listeners[name] = [];

        const listener = new EventListener(callback, recieveCanceled, priority);
        Events.#listeners[name].push(listener);
        Events.#listeners[name].sort((a, b) => b.priority - a.priority);
        return listener;
    }

    /**
     * Removes the provided {@link EventListener} from recieving further events.
     * Does nothing if the provided listener was not registered for the provided event/already unregistered.
     * @param {string} name name of the event to remove the listener from
     * @param {EventListener} listener the {@link EventListener} to remove
     */
    static remove(name, listener) {
        if (!Events.#listeners[name]) return;

        const index = Events.#listeners[name].indexOf(listener);
        if (index >= 0) Events.#listeners[name].splice(index, 1);
    }

    /**
     * Triggeres the named event. 
     * All listeners registered with the same name will be called in order of priority.
     * Optionally allows flagging the event as cancelable.
     * Canceled events will only be passed to listeners which where specifically registered to recieve them.
     * Returns the event object after calling all relevant listeners which can be used to check cancelled state.
     * @param {string} name name of the event to trigger
     * @param {*} data custom data object
     * @param {boolean} cancelable sets the event to be cancelable, defaults to false
     * @returns {Event} the triggered event object after all listeners have been called
     */
    static trigger(name, data, cancelable = false) {
        const event = new Event(data, cancelable);

        const listeners = Events.#listeners[name];
        if (!listeners) return event;

        for (const listener of listeners) {
            if (!event.canceled || listener.recieveCanceled) {
                listener.callback(event);
            }
        }

        return event;
    }
}

//TODO: this is duplicated from event-listener.js, see if there is a better way of accessing a custom defined type from multiple modules
/**
 * Callback for implementing an event listener.
 * See {@link Events.on} for how to register a listener.
 * @callback EventCallback
 * @param {Event} event the event object
 * @returns {void}
 */
