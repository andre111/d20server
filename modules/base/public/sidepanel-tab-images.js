class SidepanelTabImages extends SidepanelTab {
    constructor() {
        super("Images", "images", ServerData.isGM());
        
        this.tab.style.display = "grid";
        this.tab.style.gridTemplateRows = "auto max-content max-content";
        
        var treePanel = document.createElement("div");
        treePanel.style.overflow = "auto";
        this.tab.appendChild(treePanel);
        this.tree = new SearchableIDTree(treePanel, "sidepanel-tab-images", ValueProviders.get("image"));
        EntityManagers.get("image").addListener(() => this.tree.reload());
        
        var buttonPanel1 = document.createElement("div");
        this.tab.appendChild(buttonPanel1);
        GuiUtils.createButton(buttonPanel1, "Add as Token", () => this.doAddAsToken());
        GuiUtils.createButton(buttonPanel1, "Apply to Token", () => this.doApplyToToken());
        GuiUtils.createButton(buttonPanel1, "Show to Players", () => this.doShowToPlayers());
        
        var buttonPanel2 = document.createElement("div");
        this.tab.appendChild(buttonPanel2);
        GuiUtils.createButton(buttonPanel2, "Rename", () => this.doRename());
        GuiUtils.createButton(buttonPanel2, "Upload Image", () => this.doUploadImage());
        GuiUtils.createButton(buttonPanel2, "Remove Image", () => this.doRemoveImage());
    }
    
    doAddAsToken() {
        var id = this.tree.getSelectedValue();
        if(id) {
            if(StateMain.mode instanceof CanvasModeEntities && StateMain.mode.entityType == "token") {
                var token = Entity.create("token");
                token.prop("imageID").setLong(id);
                StateMain.mode.setAddEntityAction(token);
            }
        }
    }
    
    doApplyToToken() {
        var id = this.tree.getSelectedValue();
        if(id) {
            if(StateMain.mode instanceof CanvasModeEntities && StateMain.mode.entityType == "token") {
                if(StateMain.mode.activeEntities.length == 1) {
                    var reference = StateMain.mode.activeEntities[0];
                    reference.prop("imageID").setLong(id);
                    reference.performUpdate();
                }
            }
        }
    }
    
    doShowToPlayers() {
        var id = this.tree.getSelectedValue();
        if(id) {
            var msg = {
                msg: "ActionCommand",
                command: "SHOW_IMAGE",
                id: id
            };
            MessageService.send(msg);
        }
    }
    
    doRename() {
        var id = this.tree.getSelectedValue();
        if(id) {
            var reference = EntityReference.create(EntityManagers.get("image").find(id));
            
            new CanvasWindowInput("Rename Image", "Enter Image Name:", reference.getName(), name => {
                if(name) {
                    reference.prop("name").setString(name);
                    reference.performUpdate();
                }
            });
        }
    }
    
    doUploadImage() {
        new CanvasWindowUpload("Upload Image", "image/png", "/upload/image");
    }
    
    doRemoveImage() {
        var id = this.tree.getSelectedValue();
        if(id) {
            new CanvasWindowConfirm("Confirm removal", "Are you sure you want to remove the image: "+EntityManagers.get("image").find(id).getName()+"?", () => {
                EntityManagers.get("image").remove(id);
            });
        }
    }
}
