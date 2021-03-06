// @ts-check
import { Client } from '../client.js';

export class Notification {
    #element;
    #time;

    constructor(content, time) {
        this.#element = document.createElement('span');
        this.#element.innerText = content;

        this.#time = time * Client.FPS;
    }

    update() {
        this.#time--;
        if (this.#time < Client.FPS) {
            this.#element.style.opacity = String(this.#time / Client.FPS);
        }
        return this.#time > 0;
    }

    getElement() {
        return this.#element;
    }
}
