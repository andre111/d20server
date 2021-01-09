import { MouseController } from '../../mouse-controller.js';

export class EntityAction extends MouseController {
    constructor(mode) {
        super();
        
        this.mode = mode;
    }
    
    init() {}
    exit() {}
    renderOverlay(ctx) {}
    actionPerformed(action) {}
}
