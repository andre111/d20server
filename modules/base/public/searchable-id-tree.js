class SearchableIDTree {
    constructor(parent, identifier, iconProvider, textProvider) {
        //TODO: replace this first test with actual implementation
        this.parent = parent;
        
        this.searchPanel = document.createElement("div");
        this.filter = document.createElement("input");
        this.filter.type = "text";
        this.filter.className = "tree-search-input";
        this.filter.onchange = () => this._onFilter();
        this.searchPanel.appendChild(this.filter);
        this.parent.appendChild(this.searchPanel);
        
        this.container = document.createElement("div");
        this.parent.appendChild(this.container);
        
        this.iconProvider = iconProvider;
        this.textProvider = textProvider;
        
        $(this.container).jstree({
            "plugins": [ "search", "state" ],
            "search": {
                "case_sensitive": false,
                "show_only_matches": true
                //TODO: "search_callback": (search, node) => ...
            },
            "state": {
                "key": identifier
            }
        });
        this.tree = $(this.container).jstree(true);
        this.tree.settings.core.multiple = false;
        
        this.reload(EntityManagers.get("actor").all(), a => a.getName());
    }
    
    reload(map, toNameFunc, toTagsFunc) {
        // sort keys by value names
        var sorted = Object.keys(map);
        sorted.sort((o1, o2) => {
            var p1 = toNameFunc(map[o1]).split("/");
            var p2 = toNameFunc(map[o2]).split("/");
            
            // skip all equal parts
            var i1 = 0;
            var i2 = 0;
            while(i1 < p1.length && i2 < p2.length && p1[i1] == p2[i2]) {
                i1++;
                i2++;
            }
            
            // if we reached the end of one path, but not the other, sort directories before files
            if(i1 == p1.length && i2 == p2.length) {
                return 0;
            } else if(i1 == p1.length-1 && i2 != p2.length-1) {
                return 1;
            } else if(i2 == p2.length-1 && i1 != p1.length-1) {
                return -1;
            }
            
            // else just compare the current name
            return p1[i1] < p2[i2] ? -1 : p1[i1] > p2[i2]; // seemingly way more efficient than localCompare
        });
        
        // rebuild tree
        var directoryNodes = {};
        var nodeList = [];
        for(var id of sorted) {
            var entry = map[id];
            
            var fullPath = toNameFunc(entry);
            this._addDirectories(directoryNodes, nodeList, fullPath);
            
            var parentPath = fullPath.includes("/") ? fullPath.substring(0, fullPath.lastIndexOf("/")+1) : "#";
            
            var name = fullPath.includes("/") ? fullPath.substring(fullPath.lastIndexOf("/")+1) : fullPath;
            var text = (this.textProvider != null && this.textProvider != undefined) ? this.textProvider(entry) : null;
            text = (text != null && text != undefined) ? '<br><p class="tree-entry-text">'+text+'</p>' : '';
            
            var node = {
                id: id,
                parent: parentPath,
                text: name + text
                //TODO: identifyablity?
            };
            var icon = this.iconProvider(entry);
            if(icon != null && icon != undefined) node.icon = icon;
            nodeList.push(node);
        }
        
        this.tree.settings.core.data = nodeList;
        this.tree.refresh();
    }
    _addDirectories(directoryNodes, nodeList, path) {
        var split = path.split("/", -1);
        var dirPath = "";
        for(var i=0; i<split.length-1; i++) {
            var parent = (dirPath == "") ? "#" : directoryNodes[dirPath];
            
            dirPath = dirPath + split[i] + "/";
            if(directoryNodes[dirPath] == null || directoryNodes[dirPath] == undefined) {
                var dirName = split[i];
                var dirNode = {
                    id: dirPath,
                    parent: parent,
                    text: dirName
                };
                
                nodeList.push(dirNode); // add node
                directoryNodes[dirPath] = dirPath; // store id
            }
        }
    }
    
    _onFilter() {
        this.tree.search(this.filter.value);
    }
    
    getSelectedValue() {
        var entries = this.tree.get_selected();
        if(entries.length == 1) {
            var id = Number(entries[0]);
            if(!Number.isNaN(id)) {
                return id;
            }
        }
        return null;
    }
}
