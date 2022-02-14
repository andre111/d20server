import { CanvasMode } from '../canvas-mode.js';
import { WallActionCreateWall } from './wall-action-create-wall.js';
import { MapUtils } from '../../util/maputil.js';
import { Client } from '../../client.js';

export { WallActionCreateWall } from './wall-action-create-wall.js';
export { WallActionCreateOneSidedWall } from './wall-action-create-one-sided-wall.js';
export { WallActionCreateWindow } from './wall-action-create-window.js';
export { WallActionCreateDoor } from './wall-action-create-door.js';
export class CanvasModeWalls extends CanvasMode {
    constructor() {
        super();

        this.action = new WallActionCreateWall(this);
    }

    init() {
        this.setAction(new WallActionCreateWall(this));

        Client.getState().setControllHints([
            'mouse-left', 'controlls.add.wall',
            'mouse-right', 'controlls.contextmenu',
            'key-Ctrl', 'controlls.disablesnap'
        ]);
    }

    exit() {
        this.action.exit();
    }

    renderOverlay(ctx) {
        this.action.renderOverlay(ctx);
    }

    mouseClicked(e) {
        this.action.mouseClicked(e);
    }

    mousePressed(e) {
        this.action.mousePressed(e);
    }

    mouseReleased(e) {
        this.action.mouseReleased(e);
    }

    mouseEntered(e) {
        this.action.mouseEntered(e);
    }

    mouseExited(e) {
        this.action.mouseExited(e);
    }

    mouseDragged(e) {
        this.action.mouseDragged(e);
    }

    mouseMoved(e) {
        this.action.mouseMoved(e);
    }

    mouseWheelMoved(e) {
        this.action.mouseWheelMoved(e);
    }

    actionPerformed(a) {
        var map = MapUtils.currentMap();
        if (map == null || map == undefined) return;

        this.action.actionPerformed(a);
    }

    resetAction() {
        this.setAction(new WallActionCreateWall(this));
    }

    setAction(action) {
        this.action.exit();
        this.action = action;
        this.action.init();
    }
}
