WindowManager = { 
    createWindow: function(title, modal) {
        var container = document.getElementById("overlay");
        
        // create window
        var panel = document.createElement("div");
        panel.title = title;
        
        // add to container
        container.appendChild(panel);
        
        // make dialog
        $(panel).dialog({
            modal: modal,
            close: function(event, ui) {
                $(panel).dialog("destroy");
                container.removeChild(panel);
            }
        });
        
        return panel;
    }
}
