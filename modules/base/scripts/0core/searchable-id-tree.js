ValueProviders = {
    get: function(type) {
        switch(type) {
        case "actor":
            return new ActorValueProvider();
        case "attachment":
            return new AttachmentValueProvider();
        case "image":
            return new ImageValueProvider();
        case "profile":
            return new ProfileValueProvider();
        default:
            return new DefaultValueProvider(type);
        }
    }
}
class ValueProvider {
    constructor() {
    }
    
    getData() { return new Map(); }
    getValue(id) {}
    
    getName(value) {}
    getIcon(value) { return null; }
    getSubText(value) { return null; }
    getTags(value) { return []; }
}
class DefaultValueProvider extends ValueProvider {
    constructor(type) {
        super();
        
        this.type = type;
    }
    
    getData() {
        return EntityManagers.get(this.type).map();
    }
    
    getValue(id) {
        return EntityManagers.get(this.type).find(id);
    }
    
    getName(value) {
        if(value == null || value == undefined) return "";
        
        return value.getName();
    }
    
    getIcon(value) {
        if(value == null || value == undefined) return null;
        
        var property = this.getIconProperty(value);
        if(property != null && property != undefined && property.getLong() > 0) {
            return "/image/"+property.getLong();
        }
        return null;
    }
    
    getIconProperty(value) {
        return value.prop("imageID");
    }
}
class ActorValueProvider extends DefaultValueProvider {
    constructor() {
        super("actor");
    }
    
    getIconProperty(value) {
        var token = EntityManagers.get("token").find(value.prop("defaultToken").getLong());
        if(token != null && token != undefined) {
            return token.prop("imageID");
        }
        return null;
    }
}
class AttachmentValueProvider extends DefaultValueProvider {
    constructor() {
        super("attachment");
    }
    
    getSubText(value) {
        if(value == null || value == undefined) return null;
        
        return value.prop("descShort").getString();
    }
    
    getTags(value) {
        if(value == null || value == undefined) return [];
        
        return value.prop("tags").getString().split("\n");
    }
}
class ImageValueProvider extends DefaultValueProvider {
    constructor() {
        super("image");
    }
    
    getIcon(value) {
        return "/image/"+value.id;
    }
}
class ProfileValueProvider extends ValueProvider {
    constructor() {
        super();
    }
    
    getData() {
        return ServerData.profiles.get();
    }
    
    getValue(id) {
        return ServerData.profiles.get().get(id);
    }
    
    getName(value) {
        if(value == null || value == undefined) return "";
        
        return value.connected ? "Online/"+value.username : "Offline/"+value.username;
    }
    
    getIcon(value) {
        if(value == null || value == undefined) return null;
        
        return "/color/"+value.color;
    }
}

class SearchableIDTree {
    constructor(parent, identifier, valueProvider) {
        //TODO: replace this first test with actual implementation
        this.parent = parent;
        
        this.searchPanel = document.createElement("div");
        this.filter = document.createElement("input");
        this.filter.type = "text";
        this.filter.className = "tree-search-input";
        this.filter.onchange = () => this._onFilter();
        //this.filter.onkeyup = () => this._onFilter();
        this.searchPanel.appendChild(this.filter);
        this.parent.appendChild(this.searchPanel);
        
        this.container = document.createElement("div");
        this.container.style.width = "90%";
        this.parent.appendChild(this.container);
        
        this.valueProvider = valueProvider;
        
        $(this.container).jstree({
            "plugins": (identifier != null ? [ "search", "state" ] : [ "search" ]),
            "core": {
                "animation": false
            },
            "search": {
                "case_sensitive": false,
                "show_only_matches": true,
                "search_leaves_only": true,
                "search_callback": (search, node) => {
                    if(search.startsWith("?")) {
                        // tag based search
                        search = search.substring(1);
                        for(var tag of node.original.tags) {
                            if(tag.startsWith(search)) return true;
                        }
                        return false;
                    } else {
                        // name based search
                        return node.original.name.toLowerCase().includes(search);
                    }
                }
            },
            "state": {
                "key": identifier
            }
        });
        this.tree = $(this.container).jstree(true);
        this.tree.settings.core.multiple = false;
        
        this.reload(this.valueProvider.getData());
    }
    
    reload(map) {
        if(map == null || map == undefined) map = this.valueProvider.getData();
        
        // sort keys by value names
        var sorted = Array.from(map.keys());
        sorted.sort((o1, o2) => {
            var p1 = this.valueProvider.getName(map.get(o1)).split("/");
            var p2 = this.valueProvider.getName(map.get(o2)).split("/");
            
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
        for(var key of sorted) {
            var entry = map.get(key);
            
            var fullPath = this.valueProvider.getName(entry);
            this._addDirectories(directoryNodes, nodeList, fullPath);
            
            var parentPath = fullPath.includes("/") ? fullPath.substring(0, fullPath.lastIndexOf("/")+1) : "#";
            
            var name = fullPath.includes("/") ? fullPath.substring(fullPath.lastIndexOf("/")+1) : fullPath;
            var text = this.valueProvider.getSubText(entry);
            text = (text != null && text != undefined) ? '<br><p class="tree-entry-text">'+text+'</p>' : '';
            
            var node = {
                id: key,
                parent: parentPath,
                text: name + text,
                name: name,
                tags: this.valueProvider.getTags(entry)
            };
            var icon = this.valueProvider.getIcon(entry);
            if(icon != null && icon != undefined) node.icon = icon;
            else node.icon = false;
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
                    text: dirName,
                    name: dirName
                };
                
                nodeList.push(dirNode); // add node
                directoryNodes[dirPath] = dirPath; // store id
            }
        }
    }
    
    _onFilter() {
        this.tree.search(this.filter.value.toLowerCase());
    }
    
    expandAll() {
        this.tree.open_all();
    }
    
    getSearchPanel() {
        return this.searchPanel;
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
