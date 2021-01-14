import { Client } from '../app.js';
import { MouseController } from '../mouse-controller.js';
import { InputService } from '../service/input-service.js';

export class MouseControllerCanvas extends MouseController {
    canvas;

    constructor(canvas) {
        super();
        
        this.canvas = canvas;
        
        canvas.addEventListener("keydown", e => this.keyPressed(e), true);
    }
    
    mouseDragged(e) {
        Client.getState().mouseDragged(e);
    }
    mouseMoved(e) {
        Client.getState().mouseMoved(e);
    }
    mouseWheelMoved(e) {
        Client.getState().mouseWheelMoved(e);
    }
    mouseClicked(e) {
        Client.getState().mouseClicked(e);
    }
    mousePressed(e) {
        Client.getState().mousePressed(e);
    }
    mouseReleased(e) {
        Client.getState().mouseReleased(e);
    }
    mouseEntered(e) {
        Client.getState().mouseEntered(e);
    }
    mouseExited(e) {
        Client.getState().mouseExited(e);
    }
    
    keyPressed(e) {
        const action = InputService.getAction(e);
        if(action != null) Client.getState().actionPerformed(action);
    }
}