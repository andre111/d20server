import { File } from './file.js';
import { DirectoryMenu } from './directory-menu.js';
import { fetchDynamicJSON } from '../../../util/fetchutil.js';

export class Directory {
    window;

    // gui elements
    element;
    divContainer;
    ulChildren;
    imgExpandIcon;
    expanded;
    spanName;

    // data
    path;
    dirCount;
    fileCount;

    files = [];
    selectedFile = null;

    constructor(window, path, dirCount, fileCount) {
        this.window = window;

        this.path = path ? path : '/';
        this.dirCount = dirCount ? dirCount : 0;
        this.fileCount = fileCount ? fileCount : 0;

        this.createElement();
    }

    createElement() {
        this.element = document.createElement('li');

        // name / icon / ...
        this.divContainer = document.createElement('div');
        this.element.appendChild(this.divContainer);

        this.imgExpandIcon = document.createElement('img');
        this.imgExpandIcon.className = 'fileman-expand';
        this.imgExpandIcon.width = 9;
        this.imgExpandIcon.height = 9;
        this.divContainer.appendChild(this.imgExpandIcon);

        const directoryIcon = document.createElement('img');
        directoryIcon.className = 'fileman-diricon';
        directoryIcon.src = '/core/files/img/fileman/folder.png';
        this.divContainer.appendChild(directoryIcon);

        this.spanName = document.createElement('span');
        this.divContainer.appendChild(this.spanName);

        // sublist for child directories
        this.element.appendChild(this.ulChildren = document.createElement('ul'));
        this.expanded = false;

        // create callbacks
        this.divContainer.onclick = e => {
            this.window.selectDirectory(this, false);
            this.setExpanded(true);
        };
        this.divContainer.oncontextmenu = e => {
            e.preventDefault();
            this.window.selectDirectory(this, false);

            if (this.window.canEdit()) {
                new DirectoryMenu(this, e.clientX, e.clientY);
            }
            return false;
        };
        this.imgExpandIcon.onclick = e => {
            this.setExpanded(!this.expanded);
            e.stopPropagation();
            e.preventDefault();
        };
        if (this.window.canEdit()) {
            this.divContainer.ondragenter = (event) => {
                event.preventDefault();
                this.divContainer.classList.add('drop');
            };
            this.divContainer.ondragover = (event) => {
                event.preventDefault();
            };
            this.divContainer.ondragleave = (event) => {
                event.preventDefault();
                this.divContainer.classList.remove('drop');
            };
            this.divContainer.ondrop = (event) => {
                this.divContainer.classList.remove('drop');

                const file = event.dataTransfer.getData('file');
                if (file && file != '') {
                    event.preventDefault();
                    this.moveFile(file);
                }
            };
            //TODO: make it draggable? should I allow moving whole directories?
        }

        // load data
        this.reloadElement();
    }

    reloadElement() {
        this.imgExpandIcon.src = '/core/files/img/fileman/' + (this.dirCount > 0 ? 'dir-plus.png' : 'blank.gif');
        this.spanName.innerHTML = this.getName();
        //TODO: children?
    }

    // getters
    getWindow() {
        return this.window;
    }

    getElement() {
        return this.element;
    }

    getDIVContainer() {
        return this.divContainer;
    }

    getULChildren() {
        return this.ulChildren;
    }

    getPath() {
        return this.path;
    }

    getName() {
        return this.path.includes('/') ? this.path.substring(this.path.lastIndexOf('/') + 1) : this.path;
    }

    getParentPath() {
        return this.path.includes('/') ? this.path.substring(0, this.path.lastIndexOf('/')) : '';
    }

    getDirectoryCount() {
        return this.dirCount;
    }

    getFileCount() {
        return this.fileCount;
    }

    getFiles() {
        return this.files;
    }

    getSelectedFile() {
        return this.selectedFile;
    }

    setSelectedFile(selectedFile) {
        this.selectedFile = selectedFile;
    }

    getFileIndex(filepath) {
        for (var i = 0; i < this.files.length; i++) {
            if (this.files[i].getPath() == filepath) return i;
        }
        return -1;
    }

    // client methods
    setExpanded(expanded) {
        if (this.dirCount == 0) return;

        // toggle child display
        const display = expanded ? 'list-item' : 'none';
        for (const child of this.ulChildren.children) {
            child.style.display = display;
        }

        // toggle icon
        this.imgExpandIcon.src = '/core/files/img/fileman/' + (expanded ? 'dir-minus.png' : 'dir-plus.png');
        this.expanded = expanded;
    }

    setFiles(files) {
        this.files = files;
    }

    // server calling methods
    loadFiles(forceReload, callback) {
        var selectedFilePath = this.selectedFile ? this.selectedFile.getPath() : null;

        // clear old data
        if (forceReload) this.files = [];
        if (forceReload) this.selectedFile = null;

        // start loading
        if (this.files.length == 0) {
            var newFiles = [];
            var newSelectedFile = null;

            fetchDynamicJSON('/fileman/fileslist', { d: this.path }, data => {
                // parse files
                for (const file of data) {
                    const f = new File(this.window, this, file.p, file.s, file.t);
                    newFiles.push(f);
                    if (selectedFilePath && file.p == selectedFilePath) newSelectedFile = f;
                }

                this.sortFiles();

                // (re)store state and call callback
                this.files = newFiles;
                this.selectedFile = newSelectedFile;
                callback();
            }, error => {
                console.log('Error loading files', error);
            });
        } else {
            this.sortFiles();
            callback();
        }
    }

    moveFile(filePath) {
        const fileName = filePath.substring(filePath.lastIndexOf('/'));

        fetchDynamicJSON('/fileman/move', { f: filePath, n: this.path + fileName, k: this.window.getKey() }, data => {
            if (data.res == 'ok') {
                // determine next file (to select it)
                var selIndex = this.window.getSelectedDirectory().getFileIndex(filePath);
                var selPath = null;
                if (selIndex + 1 < this.window.getSelectedDirectory().getFiles().length) {
                    selPath = this.window.getSelectedDirectory().getFiles()[selIndex + 1].getPath();
                }

                // refresh window (by reloading the target directory reselecting the current directory)
                this.loadFiles(true, () => { });
                this.window.selectDirectory(this.window.getSelectedDirectory(), true, selPath);
            }
        }, error => {
            console.log('Error moving file', error);
        });
    }

    sortFiles() {
        var comp = null;
        this.window.orderMod = 0; // small trick to use the same comparator for both directions
        switch (this.window.inputOrder.value) {
            case 'nameASC': this.window.orderMod = 2;
            case 'nameDESC':
                comp = (a, b) => {
                    a = a.getName().toLowerCase();
                    b = b.getName().toLowerCase();

                    if (a > b) return -1 + this.window.orderMod;
                    else if (a < b) return 1 - this.window.orderMod;
                    else return 0;
                };
                break;
            case 'sizeASC': this.window.orderMod = 2;
            case 'sizeDESC':
                comp = (a, b) => {
                    a = Number(a.getSize());
                    b = Number(b.getSize());

                    if (a > b) return -1 + this.window.orderMod;
                    else if (a < b) return 1 - this.window.orderMod;
                    else return 0;
                };
                break;
            case 'timeASC': this.window.orderMod = 2;
            case 'timeDESC':
                comp = (a, b) => {
                    a = Number(a.getModified());
                    b = Number(b.getModified());

                    if (a > b) return -1 + this.window.orderMod;
                    else if (a < b) return 1 - this.window.orderMod;
                    else return 0;
                };
                break;
            default:
                return;
        }

        this.files.sort(comp);
    }
}
