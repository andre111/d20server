// @ts-check
import { MouseController } from '../../mouse-controller.js';

export class WallAction extends MouseController {
    constructor(mode) {
        super();

        this.mode = mode;
    }

    init() { }
    exit() { }
    renderOverlay(ctx) { }
    actionPerformed(action) { }
}
