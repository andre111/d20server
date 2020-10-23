SidepanelManager = {
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
        container.appendChild(panel);
        
        return panel;
    },
    
    init: function() {
        $("#sidepanel").tabs({
            heightStyle: "fill"
        });
    }
}
