import { FileMenu } from './file-menu.js';

export class File {
    window;
    directory;
    element;
    imgIcon;
    spanName;

    // base data
    path;
    size;
    modified;

    // image / media information
    width;
    height;
    length;

    constructor(window, directory, path, size, modified, width, height, length) {
        this.window = window;
        this.directory = directory;

        this.path = path;
        this.size = size;
        this.modified = modified;

        this.width = width ? width : 0;
        this.height = height ? height : 0;
        this.length = length ? length : 0;

        this.createElement();
    }

    createElement() {
        //TODO...
        this.element = document.createElement('li');
        this.element.title = this.getName();

        this.imgIcon = document.createElement('img');
        this.imgIcon.src = '/core/files/img/fileman/blank.gif';
        this.imgIcon.className = 'fileman-thumbnail';
        this.element.appendChild(this.imgIcon);

        this.spanName = document.createElement('span');
        this.spanName.className = 'fileman-filename';
        this.element.appendChild(this.spanName);

        // create callbacks
        this.element.onclick = e => {
            this.window.selectFile(this);
        };
        this.element.ondblclick = e => {
            this.window.selectFile(this);
            this.window.confirmSelection();
        };
        this.element.oncontextmenu = e => {
            e.preventDefault();
            this.window.selectFile(this);
            if(this.window.canEdit()) {
                new FileMenu(this, e.clientX, e.clientY);
            }
            return false;
        };
        if(this.window.canEdit()) {
            //TODO: make it draggable
        }
        //TODO: tooltip

        // load data
        this.reloadElement();
    }

    reloadElement() {
        this.imgIcon.style.backgroundImage = 'url('+this.getThumbnail()+')';
        this.spanName.innerHTML = this.getName();
    }

    // getters
    getWindow() {
        return this.window;
    }

    getDirectory() {
        return this.directory;
    }

    getElement() {
        return this.element;
    }

    getPath() {
        return this.path;
    }

    getName() {
        return this.path.includes('/') ? this.path.substring(this.path.lastIndexOf('/') + 1) : this.path;
    }

    getExtension() {
        const name = this.getName();
        return name.includes('.') ? name.substring(name.lastIndexOf('.') + 1) : '';
    }

    getType() {
        const ext = this.getExtension().toLowerCase();
        switch(ext) {
        case 'png':
        case 'jpg':
        case 'jpeg':
            return 'image';
        case 'ogg':
            return 'audio';
        default:
            return 'unknown';
        }
    }

    getThumbnail() {
        //TODO...
        //TODO get basic thumbnail path based on file type
        var thumbURL = '';

        // get thumbnail path for images
        if(this.getType() == 'image') {
            thumbURL = '/fileman/generatethumb?f='+encodeURIComponent(this.getPath())+'&width=120&height=120';
        }

        return thumbURL;
    }

    getSize() {
        return this.size; //TODO: format into nice readable stuff
    }

    getModified() {
        return this.modified; //TODO: format into nice readable stuff
    }

    // setters
    setPath(path) {
        this.path = path;
    }

    // client methods

}
