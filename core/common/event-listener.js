// @ts-check
import { Event } from './event.js';

/**
 * Represents an event listener used by the Events system.
 * Should never be constructed directly, use the {@link Events.on} method for registering listeners.
 */
export class EventListener {
    #callback;
    #recieveCanceled;
    #priority;

    /**
     * @param {EventCallback} callback the {@link EventCallback} to use
     * @param {boolean} recieveCanceled should this listener recieve events that have already been canceled by earlier listeners
     * @param {number} priority the priority, listeners with higher priority will be called first
     */
    constructor(callback, recieveCanceled, priority) {
        this.#callback = callback;
        this.#recieveCanceled = recieveCanceled;
        this.#priority = priority;
    }

    /**
     * The {@link EventCallback} of this listener that will be called when the event is passed to this listener.
     */
    get callback() {
        return this.#callback;
    }

    /**
     * Indicates whether this listener should recieve canceled events.
     */
    get recieveCanceled() {
        return this.#recieveCanceled;
    }

    /**
     * The priority of this listener, higher priority listeners will be called first.
     */
    get priority() {
        return this.#priority;
    }
}

/**
 * Callback for implementing an event listener.
 * See {@link Events.on} for how to register a listener.
 * @callback EventCallback
 * @param {Event} event the event object
 * @returns {void}
 */
