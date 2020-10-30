class CanvasWindowInfo extends CanvasWindow {
    constructor(title, text) {
        super(title, true);
        
        // create html elements
        this.frame.appendChild(document.createTextNode(text));
    }
}
