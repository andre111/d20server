class CanvasWindowInput extends CanvasWindow {
    constructor(title, text, value, callback) {
        super(title, true);
        
        // create html elements
        this.frame.appendChild(document.createTextNode(text));
        
        var input = document.createElement("input");
        input.type = "text";
        input.value = value;
        this.frame.appendChild(input);
        
        var buttonPanel = document.createElement("div");
        this.frame.appendChild(buttonPanel);
        
        var okButton = document.createElement("button");
        okButton.innerHTML = "Ok";
        okButton.onclick = () => { callback(input.value); this.close(); };
        buttonPanel.appendChild(okButton);
        
        var cancelButton = document.createElement("button");
        cancelButton.innerHTML = "Cancel";
        cancelButton.onclick = () => this.close();
        buttonPanel.appendChild(cancelButton);
        
        // make pressing enter in input confirm the dialog as well
        input.onkeydown = e => {
            if(e.keyCode == 13) {
                callback(input.value); 
                this.close();
            }
        };
        
        // focus main input
        input.focus();
    }
}
