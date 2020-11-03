class SidepanelTabLists extends SidepanelTab {
    constructor() {
        super("Lists", "lists", ServerData.isGM());
        
        this.tab.style.display = "grid";
        this.tab.style.gridTemplateRows = "auto max-content max-content";
        
        var treePanel = document.createElement("div");
        treePanel.style.overflow = "auto";
        this.tab.appendChild(treePanel);
        this.tree = new SearchableIDTree(treePanel, "sidepanel-tab-lists", ValueProviders.get("token_list"));
        EntityManagers.get("token_list").addListener(() => this.tree.reload());
        
        var buttonPanel1 = document.createElement("div");
        this.tab.appendChild(buttonPanel1);
        GuiUtils.createButton(buttonPanel1, "New List", () => this.doNewList());
        GuiUtils.createButton(buttonPanel1, "Toggle Visibility", () => this.doToggleVisibility());
        GuiUtils.createButton(buttonPanel1, "Edit List", () => this.doEditList());
        GuiUtils.createButton(buttonPanel1, "Remove List", () => this.doRemoveList());
    }
    
    doNewList() {
        new CanvasWindowInput("New List", "Enter List Name:", "", name => {
            if(name) {
                var list = Entity.create("token_list");
                list.prop("name").setString(name.replace(" ", "")); //TODO: verify name is valid identifier (just letters and numbers and unique)
                list.prop("displayName").setString(name);
                EntityManagers.get("token_list").add(list);
            }
        });
    }
    
    doToggleVisibility() {
        var id = this.tree.getSelectedValue();
        if(id) {
            var list = EntityManagers.get("token_list").find(id);
            if(list) {
                var reference = EntityReference.create(list);
                reference.prop("display").setBoolean(!reference.prop("display").getBoolean());
                reference.performUpdate();
            }
        }
    }
    
    doEditList() {
        var id = this.tree.getSelectedValue();
        if(id) {
            var list = EntityManagers.get("token_list").find(id);
            if(list) new CanvasWindowEditEntity(EntityReference.create(list));
        }
    }
    
    doRemoveList() {
        var id = this.tree.getSelectedValue();
        if(id) {
            new CanvasWindowConfirm("Confirm removal", "Are you sure you want to remove the list: "+EntityManagers.get("token_list").find(id).getName()+"?", () => {
                EntityManagers.get("token_list").remove(id);
            });
        }
    }
}
