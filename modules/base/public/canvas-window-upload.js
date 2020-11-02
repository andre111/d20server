class CanvasWindowUpload extends CanvasWindow {
    constructor(title, filetype, uploadurl) {
        super(title, true);
        
        this.filetype = filetype;
        this.uploadurl = uploadurl;
        
        // create html elements
        this.selector = document.createElement("input");
        this.selector.type = "file";
        this.selector.accept = filetype;
        this.selector.multiple = false;
        this.frame.appendChild(this.selector);
        
        var w = this;
        $(this.frame).dialog("option", "buttons", [
            {
                text: "Ok",
                click: function() {
                    w.doUpload();
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
    
    doUpload() {
        if(this.selector.files.length == 1) {
            var file = this.selector.files[0];
            var formData = new FormData();

            formData.append("upload", file);
            fetch(this.uploadurl, {method: "POST", body: formData});
        }
    }
}
