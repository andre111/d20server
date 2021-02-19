export class Notification {
    #element;
    #time;
    
    constructor(content, time) {
        this.#element = document.createElement('span');
        this.#element.innerText = content;

        this.#time = time;
    }

    update() {
        this.#time--;
        if(this.#time < 20) {
            this.#element.style.opacity = this.#time/20;
        }
        return this.#time > 0;
    }

    getElement() {
        return this.#element;
    }
}
