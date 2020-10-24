StateMain = {
    init: function() {
        // create base elements
        var canvas = document.createElement("canvas");
        canvas.id = "canvas";
        document.body.appendChild(canvas);
        var sidepanel = document.createElement("div");
        sidepanel.id = "sidepanel";
        sidepanel.appendChild(document.createElement("ul"));
        document.body.appendChild(sidepanel);
        var overlay = document.createElement("overlay");
        overlay.id = "overlay";
        document.body.appendChild(overlay);
        
        //TODO: ...
        startMain();
    },
    
    exit: function() {
        //TODO: improve this
        document.body.innerHTML = "";
    }
}
