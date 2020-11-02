class CanvasWindowChoose extends CanvasWindow {
    constructor(type, data, callback) {
        super("Select "+type, true);
       
        //TODO: create html elements
        var tree = new SearchableIDTree(this.frame, null, ValueProviders.get(type));
        if(data != null) tree.reload(data); //TODO: is reloading required here still?
        
        $(this.frame).dialog("option", "buttons", [
            {
                text: "Ok",
                click: function() {
                    var choosen = tree.getSelectedValue();
                    if(choosen != null && choosen != undefined) {
                        callback(choosen);
                    } else {
                        callback(-1);
                    }
                    $(this).dialog("close");
                }
            },
            {
                text: "Cancel",
                click: function() {
                    $(this).dialog("close");
                }
            }
        ]);
    }
}
