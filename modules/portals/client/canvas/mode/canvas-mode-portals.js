import { CanvasMode } from '../../../../../core/client/canvas/canvas-mode.js';
import { Client } from '../../../../../core/client/client.js';
import { MapUtils } from '../../../../../core/client/util/maputil.js';
import { Entity } from '../../../../../core/common/common.js';
import { EntityReference } from '../../../../../core/common/entity/entity-reference.js';
import { IntMathUtils } from '../../../../../core/common/util/mathutil.js';


export class CanvasModePortals extends CanvasMode {
    #startX;
    #startY;
    #currentX;
    #currentY;
    #active;

    constructor() {
        super();

        this.#active = false;
    }

    init() {
        this.#active = false;
        this.updateControllHints();
    }

    exit() {
    }

    renderOverlay(ctx) {
        if (this.#active) {
            ctx.strokeStyle = 'rgba(255, 100, 255, 0.5)';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(this.#startX, this.#startY);
            ctx.lineTo(this.#currentX, this.#currentY);
            ctx.stroke();
        }
    }

    mouseClicked(e) {
        this.updateCurrentPos(!e.ctrlKey, e.xm, e.ym);

        if (!this.#active) {
            if (e.which == 1) {
                this.#active = true;
                this.#startX = this.#currentX;
                this.#startY = this.#currentY;
            }

            if (e.which == 3) {
                // override pos with non snapped pos no matter the alt press
                this.updateCurrentPos(false, e.xm, e.ym);

                // find nearest (limited to 10 pixels of) clicked portal
                var clickedPortal = MapUtils.currentEntities('portal')
                    .map(portal => { return { p: portal, dist: IntMathUtils.getDistanceSQTo(portal.getLong('x1'), portal.getLong('y1'), portal.getLong('x2'), portal.getLong('y2'), this.#currentX, this.#currentY) } })
                    .filter(pwd => pwd.dist <= 10 * 10)
                    .sort((a, b) => a.dist - b.dist)
                    .map(pwd => pwd.p)[0];

                // delete
                if (clickedPortal) {
                    const reference = new EntityReference(clickedPortal);
                    reference.performRemove();
                }
            }
        } else {
            const map = MapUtils.currentMap();
            if (e.which == 1 && map) {
                var newPortal = new Entity('portal');
                newPortal.setLong('x1', this.#startX);
                newPortal.setLong('y1', this.#startY);
                newPortal.setLong('x2', this.#currentX);
                newPortal.setLong('y2', this.#currentY);
                map.getContainedEntityManager('portal').add(newPortal);

                this.#active = false;
            }

            if (e.which == 3) {
                this.#active = false;
            }
        }
        this.updateControllHints();
    }

    mouseMoved(e) {
        this.updateCurrentPos(!e.ctrlKey, e.xm, e.ym);
    }

    actionPerformed(a) {
    }

    updateCurrentPos(snap, x, y) {
        if (snap) {
            // snap to grid (set snap to true when control is NOT down)
            var map = MapUtils.currentMap();
            if (map) {
                x = Math.round(x / (map.getLong('gridSize') / 2)) * (map.getLong('gridSize') / 2);
                y = Math.round(y / (map.getLong('gridSize') / 2)) * (map.getLong('gridSize') / 2);
            }
        }

        this.#currentX = x;
        this.#currentY = y;
    }

    updateControllHints() {
        if (!this.#active) {
            Client.getState().setControllHints([
                'mouse-left', 'controlls.add.portal.entrance',
                'mouse-right', 'controlls.delete'
            ]);
        } else {
            Client.getState().setControllHints([
                'mouse-left', 'controlls.add.portal.exit',
                'mouse-right', 'global.cancel'
            ]);
        }
    }
}
