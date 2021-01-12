function createWindow(title, modal, onClose) {
    const container = document.body;
    
    // create window
    const panel = document.createElement("div");
    panel.title = title;
    var dialogClass = "";
    if(modal) dialogClass = "modal-dialog";
    
    // add to container
    container.appendChild(panel);
    
    // make dialog
    $(panel).dialog({
        modal: modal,
        close: function(event, ui) {
            if(onClose) onClose();
            $(panel).dialog("destroy");
            container.removeChild(panel);
        },
        dialogClass: dialogClass,
        maxHeight: document.body.clientHeight
    });
    
    return panel;
}

export class CanvasWindow {
    frame;
    closed;

    constructor(title, modal) {
        this.frame = createWindow(title, modal, () => { this.onClose(); });
        this.closed = false;
    }

    maximize() {
        $(this.frame).dialog("option", "position", { my: "left top", at: "left top", of: window });
        $(this.frame).dialog("option", "width", document.body.clientWidth);
        $(this.frame).dialog("option", "height", document.body.clientHeight);
    }

    getLocation() {
        var position = $(this.frame).dialog("option", "position");
        delete position["of"];
        
        var loc = {
            position: position,
            width: $(this.frame).dialog("option", "width"),
            height: $(this.frame).dialog("option", "height")
        };
        return loc;
    }
    
    setLocation(loc) {
        loc.position.of = window;
        
        $(this.frame).dialog("option", "position", loc.position);
        $(this.frame).dialog("option", "width", loc.width);
        $(this.frame).dialog("option", "height", loc.height);
    }

    setDimensions(width, height) {
        $(this.frame).dialog("option", "width", width);
        $(this.frame).dialog("option", "height", height);
    }
    
    close() {
        if(this.closed) return;
        this.closed = $(this.frame).dialog("close");
    }
    
    onClose() {
        this.closed = true;
    }
}
