class CanvasWindowConfirm extends CanvasWindow {
    constructor(title, text, callback) {
        super(title, true);
        
        // create html elements
        this.frame.appendChild(document.createTextNode(text));
        
        var buttonPanel = document.createElement("div");
        this.frame.appendChild(buttonPanel);
        
        var yesButton = document.createElement("button");
        yesButton.innerHTML = "Yes";
        yesButton.onclick = () => { callback(); this.close(); };
        buttonPanel.appendChild(yesButton);
        
        var noButton = document.createElement("button");
        noButton.innerHTML = "No";
        noButton.onclick = () => this.close();
        buttonPanel.appendChild(noButton);
        
        // focus yes button
        yesButton.focus();
    }
}
