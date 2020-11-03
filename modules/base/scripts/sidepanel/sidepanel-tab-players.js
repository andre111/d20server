class SidepanelTabPlayers extends SidepanelTab {
    constructor() {
        super("Players", "players", true);
        
        this.tree = new SearchableIDTree(this.tab, "sidepanel-tab-players", ValueProviders.get("profile"));
        ServerData.profiles.addObserver(() => this.tree.reload());
    }
}
