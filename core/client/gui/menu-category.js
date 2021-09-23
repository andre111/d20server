import { MenuItem } from './menu-item.js';

export class MenuCategory extends MenuItem {
    #items = [];
    #list;

    constructor(name) {
        super(name, () => {});

        this.#list = document.createElement('ul');
        this.#list.style.visibility = 'hidden';
        this.container.appendChild(this.#list);
        this.container.classList.add('context-menu-category');
    }

    onHover() {
        super.onHover();
        this.open();
    }

    addItem(item) {
        if(!(item instanceof MenuItem)) throw new Error('Can only add instances of MenuItem');

        this.#list.appendChild(item.container);
        this.#items.push(item);
        item.parent = this;
    }

    open() {
        if(this.parent instanceof MenuCategory) this.parent.closeAllChildren();
        
        const br = this.container.getBoundingClientRect();
        var left = br.right;
        var top = br.top;
        var height = this.#items.length * 22;
        if(top + height > window.visualViewport.height) {
            top = window.visualViewport.height - height;
        }

        this.#list.style.visibility = 'visible';
        this.#list.style.left = left + 'px';
        this.#list.style.top = top + 'px';
    }

    close() {
        this.closeAllChildren();
        this.#list.style.visibility = 'hidden';
    }

    closeAllChildren() {
        for(const item of this.#items) {
            if(item instanceof MenuCategory) {
                item.close();
            }
        }
    }

    getList() {
        return this.#list;
    }
}
