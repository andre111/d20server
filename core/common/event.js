export class Event {
    #data;

    #canceled;
    #cancelable;

    constructor(data, cancelable = false) {
        this.#data = data;
        this.#canceled = false;
        this.#cancelable = cancelable;
    }

    get data() {
        return this.#data;
    }

    get canceled() {
        return this.#canceled;
    }

    cancel() {
        if(!this.#cancelable) throw 'Event cannot be canceled';
        this.#canceled = true;
    }
}
