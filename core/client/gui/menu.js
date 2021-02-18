export class Menu {
    container;
    closed;
    closeListener;

    constructor(x, y) {
        this.container = document.createElement('ul');
        this.container.style.position = 'fixed';
        this.container.style.width = '150px';
        this.container.style.left = x+'px';
        this.container.style.top = y+'px';
        this.container.style.zIndex = 2000;
        document.body.appendChild(this.container);

        this.closed = false;
        this.closeListener = e => this.close();
    }

    open() {
        if(this.closed) return;

        $(this.container).menu({
            select: (event, ui) => {
                if(event.currentTarget.menucallback) {
                    event.currentTarget.menucallback();
                    this.close();
                }
            }
        });
        setTimeout(() => {
            document.body.addEventListener('click', this.closeListener);
            document.body.addEventListener('contextmenu', this.closeListener);
        }, 1);
    }

    createItem(parent, name, callback) {
        var item = document.createElement('li');
        var div = document.createElement('div');
        div.innerHTML = name;
        item.appendChild(div);
        item.menucallback = callback;
        parent.appendChild(item);
    }
    
    createCategory(parent, name) {
        parent = parent || this.container;

        var category = document.createElement('li');
        var div = document.createElement('div');
        div.innerHTML = name;
        category.appendChild(div);
        var container = document.createElement('ul');
        container.style.width = '180px';
        category.appendChild(container);
        
        parent.appendChild(category);
        
        return container;
    }
    
    close() {
        if(this.closed) return;
        this.closed = true;
        document.body.removeChild(this.container);
        document.body.removeEventListener('click', this.closeListener);
        document.body.removeEventListener('contextmenu', this.closeListener);
    }
}
