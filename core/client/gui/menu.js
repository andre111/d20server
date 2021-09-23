import { MenuCategory } from './menu-category.js';
import { MenuItem } from './menu-item.js';

export class Menu {
    #category;
    #container;

    #closed;
    #closeListener;

    constructor(x, y) {
        this.#category = new MenuCategory('');
        this.#container = this.#category.getList();
        this.#container.className = 'context-menu';
        this.#container.style.left = x+'px';
        this.#container.style.top = y+'px';
        this.#container.style.visibility = 'hidden';
        document.body.appendChild(this.#container);

        this.#closed = false;
        this.#closeListener = e => this.close();
    }

    open() {
        if(this.#closed) return;

        this.#container.style.visibility = 'visible';
        setTimeout(() => {
            document.body.addEventListener('click', this.#closeListener);
            document.body.addEventListener('contextmenu', this.#closeListener);
        }, 1);
    }

    createItem(parent, name, callback) {
        parent = parent || this.#category;

        const item = new MenuItem(name, callback);
        parent.addItem(item);
    }
    
    createCategory(parent, name) {
        parent = parent || this.#category;

        const category = new MenuCategory(name);
        parent.addItem(category);
        
        return category;
    }
    
    close() {
        if(this.#closed) return;
        this.#closed = true;
        document.body.removeChild(this.#container);
        document.body.removeEventListener('click', this.#closeListener);
        document.body.removeEventListener('contextmenu', this.#closeListener);
    }

    get closed() {
        return this.#closed;
    }
}
