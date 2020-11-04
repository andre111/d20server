class CanvasWindowListEntry {
    constructor(parent, list, tokenID, value, current, editable) {
        this.list = list;
        this.tokenID = tokenID;
        this.value = value;
        
        // create html elements
        var container = document.createElement("div");
        container.className = "list-window-entry";
        if(current) container.className = "list-window-entry-active";
        parent.appendChild(container);
        
        var leftPanel = document.createElement("div");
        leftPanel.style.flexGrow = "1";
        leftPanel.style.display = "flex";
        leftPanel.style.alignItems = "center";
        container.appendChild(leftPanel);
        
        var rightPanel = document.createElement("div");
        rightPanel.style.display = "inline-block";
        container.appendChild(rightPanel);
        
        //
        var token = EntityManagers.get("token").find(tokenID);
        if(token) {
            // add image
            var img = new Image();
            if(token.prop("imageID").getLong() > 0) img.src = "/image/"+token.prop("imageID").getLong();
            img.style.width = "40px";
            img.style.height = "40px";
            img.style.objectFit = "contain";
            leftPanel.appendChild(img);
            
            // add name
            var accessLevel = token.getAccessLevel(ServerData.localProfile);
            var nameProp = token.prop("name");
            if(nameProp.canView(accessLevel)) {
                leftPanel.appendChild(document.createTextNode(nameProp.getString()));
            }
        }
        
        // add remove button
        var remove = document.createElement("button");
        remove.innerHTML = "X";
        remove.disabled = !editable;
        remove.onclick = () => this.onRemove();
        rightPanel.appendChild(remove);
        
        // add value field
        this.valueField = document.createElement("input");
        this.valueField.type = "text";
        this.valueField.value = value;
        this.valueField.disabled = !editable;
        this.valueField.style.width = "40px";
        this.valueField.style.height = "40px";
        this.valueField.onchange = () => this.onConfirmChange();
        rightPanel.appendChild(this.valueField);
        
        // add hover functionality
        container.onmouseover = () => StateMain.setHighlightToken(tokenID);
        container.onmouseout = () => StateMain.releaseHighlightToken(tokenID);
    }
    
    onRemove() {
        var token = EntityManagers.get("token").find(this.tokenID);
        if(token) {
            var msg = {
                msg: "TokenListValue",
                listID: this.list.id,
                tokenID: this.tokenID,
                value: 0,
                hidden: false,
                reset: true
            };
            MessageService.send(msg);
        }
    }
    
    onConfirmChange() {
        var newValue = Number(this.valueField.value);
        if(!Number.isNaN(newValue)) {
            var token = EntityManagers.get("token").find(this.tokenID);
            if(token) {
                var msg = {
                    msg: "TokenListValue",
                    listID: this.list.id,
                    tokenID: this.tokenID,
                    value: newValue,
                    hidden: TokenListUtils.isHidden(this.list, this.tokenID),
                    reset: false
                };
                MessageService.send(msg);
            }
        }
    }
}

class CanvasWindowList extends CanvasWindow {
    constructor(list) {
        super(list.prop("displayName").getString(), false);
        
        this.list = list;
        
        // prevent closing when not GM or update visible state if proceeding
        this.shouldClose = false;
        $(this.frame).on("dialogbeforeclose", (event, ui) => { 
            if(!this.shouldClose && !ServerData.isGM()) return false; 
        });
        $(this.frame).on("dialogclose", (event, ui) => { 
            var reference = EntityReference.create(this.list);
            if(reference) {
                reference.prop("display").setBoolean(false);
                reference.performUpdate();
            }
        });
        
        // premake content
        this.buttonPanel = document.createElement("div");
        var previous = document.createElement("button");
        previous.innerHTML = "&lt;-";
        previous.onclick = () => this.doMoveIndex(-1);
        this.buttonPanel.appendChild(previous);
        var next = document.createElement("button");
        next.innerHTML = "-&gt;";
        next.onclick = () => this.doMoveIndex(1);
        this.buttonPanel.appendChild(next);
        
        // store and resize location
        this.restoreLocation();
        $(this.frame).on("dialogdragstop", () => this.storeLocation());
        $(this.frame).on("dialogresizestop", () => this.storeLocation());
    }
    
    updateList(list, shouldShow) {
        this.list = list;
        
        // add entries
        this.frame.innerHTML = "";
        var mainPanel = document.createElement("div");
        mainPanel.style.overflow = "auto";
        this.frame.appendChild(mainPanel);
        
        var i = 0;
        for(var tokenID of list.prop("tokens").getLongList()) {
            var token = EntityManagers.get("token").find(tokenID);
            var editable = token == null || token == undefined || list.canEditWithAccess(TokenListUtils.getAccessLevel(ServerData.localProfile, list, token));
            new CanvasWindowListEntry(mainPanel, list, tokenID, TokenListUtils.getValue(list, tokenID), i==list.prop("currentIndex").getLong(), editable);
            i++;
        }
        
        
        // add buttons
        if(list.canEdit(ServerData.localProfile)) {
            this.frame.appendChild(this.buttonPanel);
        }
    }
    
    close() {
        this.shouldClose = true;
        super.close();
    }
    
    doMoveIndex(offset) {
        var oldIndex = this.list.prop("currentIndex").getLong();
        var index = oldIndex + offset;
        if(index < 0) index = this.list.prop("tokens").getLongList().length-1;
        if(index >= this.list.prop("tokens").getLongList().length) index = 0;
        
        var reference = EntityReference.create(this.list);
        reference.prop("currentIndex").setLong(index);
        reference.performUpdate();
    }
    
    storeLocation() {
        var loc = this.getLocation();
        localStorage.setItem("token_list_window_"+this.list.id, JSON.stringify(loc));
    }
    
    restoreLocation() {
        var loc = localStorage.getItem("token_list_window_"+this.list.id);
        if(loc) {
            this.setLocation(JSON.parse(loc));
        }
    }
}

class CanvasWindowListManager {
    constructor() {
        this.windows = new Map();
        
        EntityManagers.get("token_list").addListener(() => this.update());
        this.update();
    }
    
    //TODO...
    update() {
        // remove windows no longer needed
        var toRemove = [];
        for(const [id, w] of this.windows) {
            var list = EntityManagers.get("token_list").find(id);
            if(!this.shouldShow(list)) {
                w.close();
                toRemove.push(id);
            }
        }
        for(var removedID of toRemove) {
            this.windows.delete(removedID);
        }
        
        // add missing windows
        for(var list of EntityManagers.get("token_list").all()) {
            if(!this.windows.has(list.id) && this.shouldShow(list)) {
                this.windows.set(list.id, new CanvasWindowList(list));
            }
        }
        
        // update all
        for(const [id, w] of this.windows) {
            var list = EntityManagers.get("token_list").find(id);
            w.updateList(list, this.shouldShow(list));
        }
    }
    
    shouldShow(list) {
        if(list == null || list == undefined) return false;
        if(list.prop("tokens").getLongList().length == 0) return false;
        if(list.getViewAccess() == Access.GM && !ServerData.isGM()) return false;
        if(!list.prop("display").getBoolean()) return false;
        
        return true;
    }
}
