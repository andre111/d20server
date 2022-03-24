// @ts-check
/**
 * Represents a single event.
 * Should never be constructed directly, use the Events class for interacting with the events system.
 */
export class Event {
    #data;

    #canceled;
    #cancelable;

    constructor(data, cancelable = false) {
        this.#data = data;
        this.#canceled = false;
        this.#cancelable = cancelable;
    }

    /**
     * The custom event data provided when the event was triggered.
     * @type {*}
     */
    get data() {
        return this.#data;
    }

    /**
     * Provides the canceled state for the event.
     * @type {boolean}
     */
    get canceled() {
        return this.#canceled;
    }

    /**
     * Indicates whether this event can be canceled.
     * @type {boolean}
     */
    get cancelable() {
        return this.#cancelable;
    }

    /**
     * Cancels the events.
     * Does nothing if the event was already canceled.
     * @throws {Error} Will throw an error when the event was not marked as cancelable
     */
    cancel() {
        if (!this.#cancelable) throw new Error('Event cannot be canceled');
        this.#canceled = true;
    }
}
