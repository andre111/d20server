import { CanvasWindowManager } from './canvas-window-manager.js';

//TODO: resizeability + storing and restoring sizes
export class CanvasWindow {
    #frame;
    #content;
    #buttons;

    #title;
    #modal;
    #closed;

    #zIndex = 0;
    #modalPane;

    #popout;
    #popoutButton;

    constructor(title, modal = false) {
        this.#title = title;
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
            if(this.#popout) return;

            const maxZIndex = CanvasWindowManager.getMaxZIndex();
            if(maxZIndex > this.zIndex) this.zIndex = maxZIndex + 1;
        };
        document.body.appendChild(this.#frame);
        
        // title bar
        const titleBar = document.createElement('div');
        titleBar.className = 'dialog-title';
        titleBar.onmousedown = e => {
            if(this.#popout) return;

            CanvasWindowManager.dragInit(this, e.clientX, e.clientY);
        };
        this.#frame.appendChild(titleBar);
        const titleP = document.createElement('p');
        titleP.innerText = title;
        titleBar.appendChild(titleP);
        this.#popoutButton = document.createElement('button');
        this.#popoutButton.style.display = 'none';
        this.#popoutButton.innerText = '↗';
        this.#popoutButton.onclick = () => this.togglePopout();
        titleBar.appendChild(this.#popoutButton);
        const closeButton = document.createElement('button');
        closeButton.innerText = '✖';
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
            this.#buttons = this.#frame.ownerDocument.createElement('div');
            this.#buttons.className = 'dialog-buttons';
            this.#frame.appendChild(this.#buttons);

            this.#content.style.height = 'calc(100% - 24px - 24px)';
        }

        const button = this.#frame.ownerDocument.createElement('button');
        button.innerText = name;
        button.onclick = callback;
        this.#buttons.appendChild(button);
    }

    showPopoutButton(show) {
        this.#popoutButton.style.display = show ? 'initial' : 'none';
    }

    maximize() {
        this.setLocation({ x: 0, y: 0, width: this.#frame.ownerDocument.body.clientWidth, height: this.#frame.ownerDocument.body.clientHeight });
    }

    center() {
        var loc = this.getLocation();
        loc.x = (this.#frame.ownerDocument.body.clientWidth - loc.width) / 2;
        loc.y = (this.#frame.ownerDocument.body.clientHeight - loc.height) / 2;
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

    setPosition(x, y) {
        this.#frame.style.left = x + 'px';
        this.#frame.style.top = y + 'px';
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

    togglePopout() {
        if(!this.#popout) {
            // create popout
            this.#popout = window.open('', '_blank', `width=${this.#frame.offsetWidth},height=${this.#frame.offsetHeight},status=no,toolbar=no,menubar=no,location=no,resizable=no,titlebar=no`);
            // create base for relative links
            const base = this.#popout.document.createElement('base');
            base.href = window.origin;
            this.#popout.document.head.appendChild(base);
            // transfer stylesheets
            for(const styleTag of document.getElementsByTagName('link')) {
                if(styleTag.rel == 'stylesheet') {
                    const newStyleTag = this.#popout.document.createElement('link');
                    newStyleTag.rel = 'stylesheet';
                    newStyleTag.href = styleTag.href;
                    this.#popout.document.head.appendChild(newStyleTag);
                }
            }
            //TODO: transfer library scripts?
            // create title
            const title = this.#popout.document.createElement('title');
            title.innerText = this.#title;
            this.#popout.document.head.appendChild(title);
            this.#popout.onWindowClose = () => this.close();

            // move window contents to popout
            this.#popout.document.body.appendChild(this.#frame);
            if(this.#modalPane) this.#modalPane.ownerDocument.body.removeChild(this.#modalPane);
            this.#modalPane = null;
            this.setPosition(0, 0);
        } else {
            // move content back
            if(this.#modal) {
                this.#modalPane = document.createElement('div');
                this.#modalPane.className = 'dialog-modal-pane';
                document.body.appendChild(this.#modalPane);
            }
            document.body.appendChild(this.#frame);
            this.center();

            // close popout
            this.#popout.onWindowClose = null;
            this.#popout.close();
            this.#popout = null;
        }
    }

    isPopout() {
        return this.#popout != null;
    }
    
    close() {
        if(this.#closed) return;
        
        this.onClose();

        if(this.#modalPane) this.#modalPane.ownerDocument.body.removeChild(this.#modalPane);
        this.#frame.ownerDocument.body.removeChild(this.#frame);
        if(this.#popout) this.#popout.close();

        CanvasWindowManager.onWindowClose(this);
        this.#closed = true;
    }
}
