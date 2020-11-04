WindowManager = { 
    createWindow: function(title, modal) {
        var container = document.body;
        
        // create window
        var panel = document.createElement("div");
        panel.title = title;
        var dialogClass = "";
        if(modal) dialogClass = "modal-dialog";
        
        // add to container
        container.appendChild(panel);
        
        // make dialog
        $(panel).dialog({
            modal: modal,
            close: function(event, ui) {
                $(panel).dialog("destroy");
                container.removeChild(panel);
            },
            dialogClass: dialogClass
        });
        
        return panel;
    }
}
