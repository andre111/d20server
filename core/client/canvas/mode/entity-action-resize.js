import { EntityAction } from './entity-action.js';
import { EntityActionSelect } from './entity-action-select.js';
import { EntityUtils } from '../../util/entityutil.js';
import { MapUtils } from '../../util/maputil.js';
import { Client } from '../../client.js';

export class EntityActionResize extends EntityAction {
    constructor(mode, mouseX, mouseY, widthMultiplier, heightMultiplier) {
        super(mode);

        this.widthMultiplier = widthMultiplier;
        this.heightMultiplier = heightMultiplier;

        // remember initial location
        var reference = this.mode.activeEntities[0];
        this.initialW = reference.getLong('width');
        this.initialH = reference.getLong('height');

        this.initialMouseX = mouseX;
        this.initialMouseY = mouseY;
    }

    init() {
        Client.getState().setControllHints([
            'mouse-left', 'controlls.resize'
        ]);
    }

    renderOverlay(ctx) {
        this.mode.renderActiveEntities(ctx, true, true);
    }

    mouseReleased(e) {
        if (e.which == 1) {
            var reference = this.mode.activeEntities[0];
            reference.performUpdate();
            this.mode.setAction(new EntityActionSelect(this.mode));
        }
    }

    mouseMoved(e) {
        this.calculateSize(e.xm, e.ym, !e.ctrlKey);
    }

    mouseDragged(e) {
        this.calculateSize(e.xm, e.ym, !e.ctrlKey);
    }

    calculateSize(xm, ym, snap) {
        var map = MapUtils.currentMap();
        if (map == null || map == undefined) return;

        var localPoint = EntityUtils.toLocalCoordinates(this.mode.activeEntities[0], xm, ym);

        // calculate offset
        var xoffset = Math.trunc(localPoint.x - this.initialMouseX);
        var yoffset = Math.trunc(localPoint.y - this.initialMouseY);

        // (test) apply to values
        var w = this.initialW + xoffset * this.widthMultiplier;
        var h = this.initialH + yoffset * this.heightMultiplier;

        // limit to minimum 10 pixels size
        if (w < 10 && this.widthMultiplier != 0) {
            xoffset = (10 - this.initialW) / this.widthMultiplier;
        }
        if (h < 10 && this.heightMultiplier != 0) {
            yoffset = (10 - this.initialH) / this.heightMultiplier;
        }

        // (test) apply to values
        w = this.initialW + xoffset * this.widthMultiplier;
        h = this.initialH + yoffset * this.heightMultiplier;

        // snap to grid sizes (the complete size?)
        var gridSize = map.getLong('gridSize');
        if (snap) {
            w = Math.round(w / gridSize) * gridSize;
            h = Math.round(h / gridSize) * gridSize;
            if (w == 0) w = gridSize;
            if (h == 0) h = gridSize;

            if (this.widthMultiplier != 0) xoffset = (w - this.initialW) / this.widthMultiplier;
            if (this.heightMultiplier != 0) yoffset = (h - this.initialH) / this.heightMultiplier;
        }

        // apply to values
        w = this.initialW + xoffset * this.widthMultiplier;
        h = this.initialH + yoffset * this.heightMultiplier;

        var reference = this.mode.activeEntities[0];
        reference.setLong('width', w);
        reference.setLong('height', h);
    }
}
