// @ts-check
import { I18N } from '../../common/util/i18n.js';

class DirectoryNode {
    tree;

    name;
    directories = [];
    entries = [];
    expanded = true;

    // gui components
    element;
    elementStyle;
    childElement;
    childElementStyle;

    className;

    constructor(tree, name, className) {
        this.tree = tree;
        this.name = name;

        this.className = className;
    }

    addDirectoryNode(directoryNode) {
        this.directories.push(directoryNode);
    }

    addEntryNode(entryNode) {
        this.entries.push(entryNode);
    }

    createElement() {
        this.element = document.createElement('li');
        this.elementStyle = this.element.style;

        // icon / name
        this.divContainer = document.createElement('div');
        this.divContainer.onclick = () => this.setExpanded(!this.expanded);
        this.element.appendChild(this.divContainer);

        const directoryIcon = document.createElement('img');
        directoryIcon.className = 'tree-list-icon';
        directoryIcon.src = '/core/files/img/fileman/folder.png';
        this.divContainer.appendChild(directoryIcon);

        const spanName = document.createElement('span');
        spanName.textContent = this.name;
        this.divContainer.appendChild(spanName);

        // sublist for children
        this.childElement = document.createElement('ul');
        this.childElementStyle = this.childElement.style;
        this.childElement.className = 'tree-list ' + this.className;
        this.element.appendChild(this.childElement);

        // children
        for (const directory of this.directories) {
            this.childElement.appendChild(directory.createElement());
        }
        for (const entry of this.entries) {
            this.childElement.appendChild(entry.createElement());
        }

        this.setExpanded(false);

        return this.element;
    }

    setExpanded(expanded, recursive) {
        // recurse to children
        if (recursive) {
            for (const directory of this.directories) {
                directory.setExpanded(expanded, true);
            }
        }

        // update own state
        if (expanded == this.expanded) return;
        if (!this.name) return; // do not expand or hide root

        this.childElementStyle.display = expanded ? 'block' : 'none';
        this.expanded = expanded;
    }

    search(searchText) {
        // search children and track match state
        var hadMatch = false;
        for (const directory of this.directories) {
            hadMatch = directory.search(searchText) || hadMatch;
        }
        for (const entry of this.entries) {
            hadMatch = entry.search(searchText) || hadMatch;
        }

        // update gui
        if (hadMatch) {
            this.elementStyle.display = 'list-item';
            if (searchText) this.setExpanded(true);
        } else {
            this.elementStyle.display = 'none';
        }
        if (!searchText) this.setExpanded(false);
        return hadMatch;
    }
}

class EntryNode {
    tree;

    id;
    name;
    description;
    tags;
    icon;
    visible = true;

    // gui elements
    element;
    elementStyle;

    constructor(tree, id, name, description, tags, icon) {
        this.tree = tree;
        this.id = id;
        this.name = name;
        this.description = description;
        this.tags = tags;
        this.icon = icon;
    }

    createElement() {
        this.element = document.createElement('li');
        this.elementStyle = this.element.style;

        // icon / name / description
        this.divContainer = document.createElement('div');
        this.divContainer.onclick = () => this.tree._onSelect(this);
        this.divContainer.ondblclick = () => this.tree._onSelect(this, true);
        this.divContainer.oncontextmenu = (event) => this.tree._onRightClick(this, event.clientX, event.clientY);
        this.element.appendChild(this.divContainer);

        if (this.icon) {
            const entryIcon = document.createElement('img');
            entryIcon.className = 'tree-list-icon';
            entryIcon.dataset.src = this.icon;
            this.divContainer.appendChild(entryIcon);

            this.tree._getImageObserver().observe(entryIcon);
        }

        const spanName = document.createElement('span');
        spanName.textContent = this.name;
        this.divContainer.appendChild(spanName);

        if (this.description) {
            this.divContainer.appendChild(document.createElement('br'));

            const pDesc = document.createElement('p');
            pDesc.className = 'tree-entry-desc';
            pDesc.textContent = this.description;
            this.divContainer.appendChild(pDesc);
        }

        return this.element;
    }

    search(searchText) {
        // perform search
        var hadMatch = false;
        if (searchText.startsWith('?')) {
            // tag based search
            if (searchText.length > 1) {
                searchText = searchText.substring(1);
                for (const tag of this.tags) {
                    if (tag.startsWith(searchText)) hadMatch = true;
                }
            }
        } else {
            // name based search
            hadMatch = this.name.toLowerCase().includes(searchText);
        }

        // update gui
        this.setVisible(hadMatch);
        if (!hadMatch && this.tree._getSelectedEntry() == this) this.tree._onSelect(null);
        return hadMatch;
    }

    setVisible(visible) {
        if (visible == this.visible) return;
        this.elementStyle.display = visible ? 'list-item' : 'none';
        this.visible = visible;
    }

    _onSelect() {
        this.divContainer.className = 'selected';
    }

    _onDeselect() {
        this.divContainer.className = '';
    }
}


export class SearchableIDTree {
    #rootDirectory;
    #selectedEntry;

    #valueProvider;
    #selectionCallback;
    #rightclickCallback;

    #imageObserver;
    #parent;
    #searchPanel;
    #filter;
    #container;

    constructor(parent, identifier, valueProvider, selectionCallback, rightclickCallback) {
        this.#parent = parent;

        this.#searchPanel = document.createElement('div');
        this.#filter = document.createElement('input');
        this.#filter.type = 'text';
        this.#filter.className = 'tree-search-input';
        this.#filter.placeholder = I18N.get('global.search', 'Search...');;
        this.#filter.oninput = () => this._onFilter();
        this.#searchPanel.appendChild(this.#filter);
        this.#parent.appendChild(this.#searchPanel);

        this.#container = document.createElement('div');
        this.#parent.appendChild(this.#container);

        this.#valueProvider = valueProvider;
        this.#selectionCallback = selectionCallback;
        this.#rightclickCallback = rightclickCallback;

        // observer for lazy loading images (using loading=lazy does not work because chrome is too eager to load these list images for some reason)
        this.#imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    /** @type {*} */ //TODO: fix this by assigning the correct type?
                    const image = entry.target;
                    image.src = image.dataset.src;
                    this.#imageObserver.unobserve(image);
                }
            });
        });

        this.reload();
    }

    reload(map) {
        if (map == null || map == undefined) map = this.#valueProvider.getData();

        // sort keys by value names
        const sorted = Array.from(Object.keys(map));
        const paths = {};
        for (const k of sorted) paths[k] = this.#valueProvider.getName(map[k]).split('/');
        sorted.sort((o1, o2) => {
            const p1 = paths[o1];
            const p2 = paths[o2];

            // skip all equal parts
            var i1 = 0;
            var i2 = 0;
            while (i1 < p1.length && i2 < p2.length && p1[i1] == p2[i2]) {
                i1++;
                i2++;
            }

            // if we reached the end of one path, but not the other, sort directories before files
            if (i1 == p1.length && i2 == p2.length) {
                return 0;
            } else if (i1 == p1.length - 1 && i2 != p2.length - 1) {
                return 1;
            } else if (i2 == p2.length - 1 && i1 != p1.length - 1) {
                return -1;
            }

            // else just compare the current name
            return p1[i1] < p2[i2] ? -1 : (p1[i1] > p2[i2] ? 1 : 0); // seemingly way more efficient than localCompare
        });


        // rebuild tree
        this.#rootDirectory = new DirectoryNode(this, '', '');
        this.#selectedEntry = null;
        this.#imageObserver.disconnect();

        var directoryNodes = {};
        directoryNodes[''] = this.#rootDirectory;
        for (const key of sorted) {
            var entry = map[key];

            var fullPath = this.#valueProvider.getName(entry);
            this._addDirectories(directoryNodes, fullPath);

            const parentPath = fullPath.includes('/') ? fullPath.substring(0, fullPath.lastIndexOf('/') + 1) : '';
            const parent = directoryNodes[parentPath];

            const name = fullPath.includes('/') ? fullPath.substring(fullPath.lastIndexOf('/') + 1) : fullPath;
            const text = this.#valueProvider.getSubText(entry);
            //text = (text != null && text != undefined) ? '<br><p class="tree-entry-text">'+text+'</p>' : '';

            const tags = this.#valueProvider.getTags(entry);
            const icon = this.#valueProvider.getIcon(entry);

            const entryNode = new EntryNode(this, key, name, text, tags, icon);
            parent.addEntryNode(entryNode);
        }

        // build html
        this.#rootDirectory.createElement();
        this.#container.innerHTML = '';
        this.#container.appendChild(this.#rootDirectory.childElement);
    }

    _addDirectories(directoryNodes, path) {
        var split = path.split('/', -1);
        var dirPath = '';
        for (var i = 0; i < split.length - 1; i++) {
            const parent = directoryNodes[dirPath];

            dirPath = dirPath + split[i] + '/';
            if (!directoryNodes[dirPath]) {
                const dirName = split[i];

                const dirNode = new DirectoryNode(this, dirName, i % 2 == 0 ? 'tree-list-bg1' : 'tree-list-bg2');
                parent.addDirectoryNode(dirNode);

                directoryNodes[dirPath] = dirNode;
            }
        }
    }

    _onFilter() {
        this.#rootDirectory.search(this.#filter.value.toLowerCase());
    }

    _onSelect(entry, confirm = false) {
        if (this.#selectedEntry) this.#selectedEntry._onDeselect();
        this.#selectedEntry = entry;
        if (this.#selectedEntry) this.#selectedEntry._onSelect();

        if (this.#selectedEntry && confirm && this.#selectionCallback) this.#selectionCallback(this.#selectedEntry.id);
    }

    _onRightClick(entry, x, y) {
        this._onSelect(entry, false);
        if (this.#selectedEntry && this.#rightclickCallback) this.#rightclickCallback(this.#selectedEntry.id, x, y);
    }

    _getSelectedEntry() {
        return this.#selectedEntry;
    }

    _getImageObserver() {
        return this.#imageObserver;
    }

    expandAll() {
        this.#rootDirectory.setExpanded(true, true);
    }

    getSearchPanel() {
        return this.#searchPanel;
    }

    getContainer() {
        return this.#container;
    }

    getSelectedValue() {
        if (this.#selectedEntry) return this.#selectedEntry.id;
        return null;
    }
}
