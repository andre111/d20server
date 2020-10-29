class CanvasWindowColorInput extends CanvasWindow {
    constructor(title, value, callback) {
        super(title, true);
        
        // create html elements
        var input = document.createElement("input");
        input.type = "color";
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
        
        // focus main input
        input.focus();
    }
}
