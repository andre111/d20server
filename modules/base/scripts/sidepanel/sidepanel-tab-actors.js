class SidepanelTabActors extends SidepanelTab {
    constructor() {
        super("Actors", "actors", true);
        
        this.tab.style.display = "grid";
        this.tab.style.gridTemplateRows = "auto max-content max-content";
        
        var treePanel = document.createElement("div");
        treePanel.style.overflow = "auto";
        this.tab.appendChild(treePanel);
        this.tree = new SearchableIDTree(treePanel, "sidepanel-tab-actors", ValueProviders.get("actor"));
        EntityManagers.get("actor").addListener(() => this.tree.reload());
        
        var buttonPanel1 = document.createElement("div");
        this.tab.appendChild(buttonPanel1);
        GuiUtils.createButton(buttonPanel1, "Open", () => this.doOpen());
        if(ServerData.isGM()) {
            GuiUtils.createButton(buttonPanel1, "Add Actor", () => this.doAdd());
            GuiUtils.createButton(buttonPanel1, "Remove Actor", () => this.doRemove());
        }
        
        if(ServerData.isGM()) {
            var buttonPanel2 = document.createElement("div");
            this.tab.appendChild(buttonPanel2);
            GuiUtils.createButton(buttonPanel2, "Create Token", () => this.doCreateToken());
            GuiUtils.createButton(buttonPanel2, "Set default Token", () => this.doSetDefaultToken());
            GuiUtils.createButton(buttonPanel2, "Show Image", () => this.doShowImage());
        }
    }
    
    doOpen() {
        var id = this.tree.getSelectedValue();
        if(id) {
            var actor = EntityManagers.get("actor").find(id);
            if(actor) new CanvasWindowEditEntity(EntityReference.create(actor));
        }
    }
    
    doAdd() {
        new CanvasWindowInput("New Actor", "Enter Actor Name:", "", name => {
            if(name) {
                var actor = Entity.create("actor");
                actor.prop("name").setString(name);
                EntityManagers.get("actor").add(actor);
            }
        });
    }
    
    doRemove() {
        var id = this.tree.getSelectedValue();
        if(id) {
            new CanvasWindowConfirm("Confirm removal", "Are you sure you want to remove the actor: "+EntityManagers.get("actor").find(id).getName()+"?", () => {
                EntityManagers.get("actor").remove(id);
            });
        }
    }
    
    doCreateToken() {
        var id = this.tree.getSelectedValue();
        if(id) {
            var actor = EntityManagers.get("actor").find(id);
            var token = actor ? EntityManagers.get("token").find(actor.prop("defaultToken").getLong()) : null;
            if(token) {
                if(StateMain.mode instanceof CanvasModeEntities && StateMain.mode.entityType == "token") {
                    StateMain.mode.setAddEntityAction(token);
                }
            }
        }
    }
    
    doSetDefaultToken() {
        var id = this.tree.getSelectedValue();
        if(id) {
            var msg = {
                msg: "SetActorDefaultToken",
                actorID: id
            };
            MessageService.send(msg);
        }
    }
    
    doShowImage() {
        var id = this.tree.getSelectedValue();
        if(id) {
            var actor = EntityManagers.get("actor").find(id);
            var token = actor ? EntityManagers.get("token").find(actor.prop("defaultToken").getLong()) : null;
            if(token) {
                var imageID = token.prop("imageID").getLong();
                if(imageID > 0) {
                    var msg = {
                        msg: "ActionCommand",
                        command: "SHOW_IMAGE",
                        id: imageID
                    };
                    MessageService.send(msg);
                }
            }
        }
    }
}
