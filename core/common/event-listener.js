export class EventListener {
    #callback;
    #recieveCanceled;
    #priority;

    constructor(callback, recieveCanceled = false, priority = 0) {
        this.#callback = callback;
        this.#recieveCanceled = recieveCanceled;
        this.#priority = priority;
    }

    get callback() {
        return this.#callback;
    }

    get recieveCanceled() {
        return this.#recieveCanceled;
    }

    get priority() {
        return this.#priority;
    }
}
