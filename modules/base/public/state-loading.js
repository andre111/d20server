StateLoading = {
    init: function() {
        // create loading div
        var div = document.createElement("div");
        div.id = "loading";
        div.className = "full-overlay";
        document.body.appendChild(div);
        
        // TODO: create loading bar
        
    },
    
    exit: function() {
        var div = document.getElementById("loading");
        div.parentElement.removeChild(div);
    }
}
