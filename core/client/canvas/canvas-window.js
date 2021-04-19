import { CanvasWindowManager } from './canvas-window-manager.js';

//TODO: resizeability + storing and restoring sizes
export class CanvasWindow {
    #frame;
    #content;
    #buttons;

    #modal;
    #closed;

    #zIndex = 0;
    #modalPane;

    constructor(title, modal = false) {
        this.#modal = modal;
        this.#closed = false;

        // create and add modal pane
        if(modal) {
            this.#modalPane = document.createElement('div');
            this.#modalPane.className = 'dialog-modal-pane';
            document.body.appendChild(this.#modalPane);
        }

        // create and add frame
        this.#frame = document.createElement('div');
        this.#frame.className = 'dialog' + (modal ? ' modal' : '');
        this.#frame.onmousedown = () => {
            const maxZIndex = CanvasWindowManager.getMaxZIndex();
            if(maxZIndex > this.zIndex) this.zIndex = maxZIndex + 1;
        };
        document.body.appendChild(this.#frame);
        
        // title bar
        const titleBar = document.createElement('div');
        titleBar.className = 'dialog-title';
        titleBar.onmousedown = e => CanvasWindowManager.dragInit(this, e.clientX, e.clientY);
        this.#frame.appendChild(titleBar);
        const titleP = document.createElement('p');
        titleP.innerText = title;
        titleBar.appendChild(titleP);
        const closeButton = document.createElement('button');
        closeButton.innerText = 'X';
        closeButton.onclick = () => this.close();
        titleBar.appendChild(closeButton);

        // content div
        this.#content = document.createElement('div');
        this.#content.className = 'dialog-content';
        this.#content.style.height = 'calc(100% - 24px)';
        this.#frame.appendChild(this.#content);

        // position and register
        this.zIndex = CanvasWindowManager.getMaxZIndex() + 1;
        CanvasWindowManager.onWindowOpen(this);
    }

    get zIndex() {
        return this.#zIndex;
    }

    set zIndex(value) {
        this.#zIndex = value;

        if(this.#modalPane) this.#modalPane.style.zIndex = value;
        this.#frame.style.zIndex = value;
    }

    get modal() {
        return this.#modal;
    }

    get closed() {
        return this.#closed;
    }

    get frame() {
        return this.#frame;
    }

    get content() {
        return this.#content;
    }

    onClose() {}

    addButton(name, callback) {
        if(!this.#buttons) {
            this.#buttons = document.createElement('div');
            this.#buttons.className = 'dialog-buttons';
            this.#frame.appendChild(this.#buttons);

            this.#content.style.height = 'calc(100% - 24px - 24px)';
        }

        const button = document.createElement('button');
        button.innerText = name;
        button.onclick = callback;
        this.#buttons.appendChild(button);
    }

    maximize() {
        this.setLocation({ x: 0, y: 0, width: document.body.clientWidth, height: document.body.clientHeight });
    }

    center() {
        var loc = this.getLocation();
        loc.x = (document.body.clientWidth - loc.width) / 2;
        loc.y = (document.body.clientHeight - loc.height) / 2;
        this.setLocation(loc);
    }

    getLocation() {
        return {
            x: this.#frame.offsetLeft,
            y: this.#frame.offsetTop,
            width: this.#frame.offsetWidth,
            height: this.#frame.offsetHeight
        };
    }
    
    setLocation(loc) {
        this.#frame.style.left = loc.x + 'px';
        this.#frame.style.top = loc.y + 'px';
        this.#frame.style.width = loc.width + 'px';
        this.#frame.style.height = loc.height + 'px';
    }

    setDimensions(width, height) {
        this.#frame.style.width = width + 'px';
        this.#frame.style.height = height + 'px';
    }

    storeAndRestoreLocation(key) {
        /*// restore location
        const resloc = localStorage.getItem(key);
        if(resloc) {
            this.setLocation(JSON.parse(resloc));
        }

        // store location
        const storeLocation = () => {
            const loc = this.getLocation();
            localStorage.setItem(key, JSON.stringify(loc));
        };
        $(this.frame).on('dialogdragstop', storeLocation);
        $(this.frame).on('dialogresizestop', storeLocation);*/
    }
    
    close() {
        if(this.#closed) return;
        
        this.onClose();
        if(this.#modalPane) {
            document.body.removeChild(this.#modalPane);
        }
        document.body.removeChild(this.#frame);

        CanvasWindowManager.onWindowClose(this);
        this.#closed = true;
    }
}
