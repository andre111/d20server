class SidepanelTab {
    constructor(name, id, visible) {
        if(visible) {
            this.tab = SidepanelManager.createTab(name, id);
        } else {
            this.tab = document.createElement("div");
        }
        SidepanelManager.registerTab(this, id);
    }
}

SidepanelManager = {
    tabs: {},
    
    createTab: function(name, id) {
        var container = document.getElementById("sidepanel");
        var links = container.getElementsByTagName("ul")[0];
        
        // create link
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = "#sptab-"+id;
        a.innerHTML = name;
        li.appendChild(a);
        links.appendChild(li);
        
        // create tab panel
        var panel = document.createElement("div");
        panel.id = "sptab-"+id;
        panel.style.height = "calc(100% - 80px)";
        panel.style.overflow = "auto";
        container.appendChild(panel);
        
        return panel;
    },
    
    registerTab: function(tab, id) {
        SidepanelManager.tabs[id] = tab;
    },
    
    getTab: function(id) {
        return SidepanelManager.tabs[id];
    },
    
    init: function() {
        $("#sidepanel").tabs({
            heightStyle: "content"
        });
    }
}
