import { EntityAction } from './entity-action.js';
import { EntityActionSelect } from './entity-action-select.js';
import { ServerData } from '../../server-data.js';
import { Client } from '../../client.js';

export class EntityActionMove extends EntityAction {
    constructor(mode, mouseX, mouseY) {
        super(mode);

        this.mode.storeMouseOffsets(mouseX, mouseY);
    }

    init() {
        Client.getState().setControllHints([
            'mouse-left', 'controlls.move',
            'key-Ctrl', 'controlls.disablesnap'
        ]);
    }

    doMove(mouseX, mouseY, snap, collideWithWalls) {
        this.mode.adjustPositions(mouseX, mouseY, snap, collideWithWalls);
    }

    finishMove() {
        for (const reference of this.mode.activeEntities) {
            reference.performUpdate();
        }
        this.mode.setAction(new EntityActionSelect(this.mode));
    }

    renderOverlay(ctx) {
        this.mode.renderActiveEntities(ctx, true, true);
    }

    mouseReleased(e) {
        if (e.which == 1) {
            this.finishMove();
        }
    }

    mouseMoved(e) {
        this.doMove(e.xm, e.ym, !e.ctrlKey, !ServerData.isGM());
    }

    mouseDragged(e) {
        this.doMove(e.xm, e.ym, !e.ctrlKey, !ServerData.isGM());
    }
}
