import { MenuCategory } from './menu-category.js';

export class MenuItem {
    #name;

    #container;
    #parent;

    constructor(name, callback) {
        this.#name = name;

        this.#container = document.createElement('li');

        const div = document.createElement('div');
        div.innerText = name;
        this.#container.appendChild(div);

        this.container.onmouseenter = e => this.onHover();
        this.#container.onclick = e => callback();
    }

    onHover() {
        if (this.parent instanceof MenuCategory) this.parent.closeAllChildren();
    }

    get name() {
        return this.#name;
    }

    get container() {
        return this.#container;
    }

    get parent() {
        return this.#parent;
    }

    set parent(parent) {
        if (!(parent instanceof MenuCategory)) throw new Error('Parent is not a menu category');

        this.#parent = parent;
    }
}
