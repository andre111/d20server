class SidepanelTabMaps extends SidepanelTab {
    constructor() {
        super("Maps", "maps", true);
        
        this.tab.style.display = "grid";
        this.tab.style.gridTemplateRows = "auto max-content max-content";
        
        var treePanel = document.createElement("div");
        treePanel.style.overflow = "auto";
        this.tab.appendChild(treePanel);
        this.tree = new SearchableIDTree(treePanel, "sidepanel-tab-maps", ValueProviders.get("map"));
        EntityManagers.get("map").addListener(() => this.tree.reload());
        
        var buttonPanel1 = document.createElement("div");
        this.tab.appendChild(buttonPanel1);
        GuiUtils.createButton(buttonPanel1, "Open Map", () => this.doOpenMap());
        if(ServerData.isGM()) {
            GuiUtils.createButton(buttonPanel1, "Move Players", () => this.doMovePlayers());
        }
        
        if(ServerData.isGM()) {
            var buttonPanel2 = document.createElement("div");
            this.tab.appendChild(buttonPanel2);
            GuiUtils.createButton(buttonPanel2, "New Map", () => this.doNewMap());
            GuiUtils.createButton(buttonPanel2, "Edit Map", () => this.doEditMap());
            GuiUtils.createButton(buttonPanel2, "Remove Map", () => this.doRemoveMap());
        }
    }
    
    doOpenMap() {
        var id = this.tree.getSelectedValue();
        if(id) {
            var msg = {
                msg: "MovePlayerToMap",
                mapID: id,
                playerID: ServerData.localProfile.id
            };
            MessageService.send(msg);
        }
    }
    
    doMovePlayers() {
        var id = this.tree.getSelectedValue();
        if(id) {
            var msg = {
                msg: "MovePlayerToMap",
                mapID: id,
                playerID: 0
            };
            MessageService.send(msg);
        }
    }
    
    doEditMap() {
        var id = this.tree.getSelectedValue();
        if(id) {
            var map = EntityManagers.get("map").find(id);
            if(map) new CanvasWindowEditEntity(EntityReference.create(map));
        }
    }
    
    doNewMap() {
        new CanvasWindowInput("New Map", "Enter Map Name:", "", name => {
            if(name) {
                var map = Entity.create("map");
                map.prop("name").setString(name);
                EntityManagers.get("map").add(map);
            }
        });
    }
    
    doRemoveMap() {
        var id = this.tree.getSelectedValue();
        if(id) {
            new CanvasWindowConfirm("Confirm removal", "Are you sure you want to remove the map: "+EntityManagers.get("map").find(id).getName()+"?", () => {
                EntityManagers.get("map").remove(id);
            });
        }
    }
}
