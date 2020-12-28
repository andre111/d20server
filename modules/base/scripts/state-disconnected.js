StateDisconnected = {
    init: function() {
         // create div
        var div = document.createElement("div");
        div.id = "disconnected";
        div.className = "full-overlay fancy-bg";
        document.body.appendChild(div);
        
        // create elements
        var fieldset = GuiUtils.createBorderedSet("Disconnected", "400px", "auto");
        fieldset.appendChild(document.createTextNode("Lost connection to server, please reload..."));
        
        div.appendChild(fieldset);
    },
    
    exit: function() {
        var div = document.getElementById("disconnected");
        div.parentElement.removeChild(div);
    }
}
