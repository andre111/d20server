// @ts-check
import { MouseController } from '../mouse-controller.js';

export class CanvasMode extends MouseController {
    constructor() {
        super();
    }

    init() { throw new Error('Cannot call abstract function'); }
    exit() { throw new Error('Cannot call abstract function'); }
    renderOverlay(ctx) { throw new Error('Cannot call abstract function'); }
    actionPerformed(action) { throw new Error('Cannot call abstract function'); }

    onLayerChange() { }
}
