class SidepanelTabPlayers extends SidepanelTab {
    constructor() {
        super("Players", "players", true);
        
        this.tab.style.display = "grid";
        this.tab.style.gridTemplateRows = "auto max-content";
        
        var treePanel = document.createElement("div");
        treePanel.style.overflow = "auto";
        this.tab.appendChild(treePanel);
        this.tree = new SearchableIDTree(treePanel, "sidepanel-tab-players", ValueProviders.get("profile"));
        ServerData.profiles.addObserver(() => this.tree.reload());
        
        var buttonPanel1 = document.createElement("div");
        this.tab.appendChild(buttonPanel1);
        GuiUtils.createButton(buttonPanel1, "Change Color", () => this.doChangeColor());
    }
    
    doChangeColor() {
        new CanvasWindowColorInput("Select Player Color", "#" + (ServerData.localProfile.color & 0x00FFFFFF).toString(16).padStart(6, '0'), color => { 
            if(color != null && color != undefined) { 
                var msg = {
                    msg: "SetPlayerColor",
                    color: parseInt(color.substring(1), 16)
                };
                MessageService.send(msg);
            }
        });
    }
}
