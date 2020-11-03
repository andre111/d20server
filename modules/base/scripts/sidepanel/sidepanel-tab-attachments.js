class SidepanelTabAttachments extends SidepanelTab {
    constructor() {
        super("Attachments", "attachments", true);
        
        this.tab.style.display = "grid";
        this.tab.style.gridTemplateRows = "auto max-content max-content";
        
        var treePanel = document.createElement("div");
        treePanel.style.overflow = "auto";
        this.tab.appendChild(treePanel);
        this.tree = new SearchableIDTree(treePanel, "sidepanel-tab-attachments", ValueProviders.get("attachment"));
        EntityManagers.get("attachment").addListener(() => this.tree.reload());
        
        var buttonPanel1 = document.createElement("div");
        this.tab.appendChild(buttonPanel1);
        GuiUtils.createButton(buttonPanel1, "Open", () => this.doOpen());
        if(ServerData.isGM()) {
            GuiUtils.createButton(buttonPanel1, "Add Attachment", () => this.doAdd());
            GuiUtils.createButton(buttonPanel1, "Remove Attachment", () => this.doRemove());
        }
    }
    
    doOpen() {
        var id = this.tree.getSelectedValue();
        if(id) {
            var attachment = EntityManagers.get("attachment").find(id);
            if(attachment) new CanvasWindowEditEntity(EntityReference.create(attachment));
        }
    }
    
    doAdd() {
        new CanvasWindowInput("New Attachment", "Enter Attachment Name:", "", name => {
            if(name) {
                var attachment = Entity.create("attachment");
                attachment.prop("name").setString(name);
                EntityManagers.get("attachment").add(attachment);
            }
        });
    }
    
    doRemove() {
        var id = this.tree.getSelectedValue();
        if(id) {
            new CanvasWindowConfirm("Confirm removal", "Are you sure you want to remove the attachment: "+EntityManagers.get("attachment").find(id).getName()+"?", () => {
                EntityManagers.get("attachment").remove(id);
            });
        }
    }
}
