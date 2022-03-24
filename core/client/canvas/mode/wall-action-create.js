// @ts-check
import { WallAction } from './wall-action.js';
import { MapUtils } from '../../util/maputil.js';
import { ServerData } from '../../server-data.js';
import { EntityMenu } from './entity-menu.js';

import { Entity } from '../../../common/common.js';
import { EntityReference } from '../../../common/entity/entity-reference.js';
import { IntMathUtils } from '../../../common/util/mathutil.js';

export class WallActionCreate extends WallAction {
    constructor(mode, seeThrough, door, oneSided) {
        super(mode);

        this.seeThrough = seeThrough;
        this.door = door;
        this.oneSided = oneSided;

        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.active = false;
    }

    exit() {
        if (this.menu != null) {
            this.menu.close();
            this.menu = null;
        }
    }

    renderOverlay(ctx) {
        if (this.active) {
            ctx.strokeStyle = this.seeThrough ? 'cyan' : 'lime';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(this.startX, this.startY);
            ctx.lineTo(this.currentX, this.currentY);
            ctx.stroke();
        }
    }

    mousePressed(e) {
        if (this.menu != null) {
            this.menu.close();
            this.menu = null;
        }
    }

    mouseClicked(e) {
        this.updateCurrentPos(!e.ctrlKey, e.xm, e.ym);

        if (!this.active) {
            if (e.which == 1) {
                this.active = true;
                this.startX = this.currentX;
                this.startY = this.currentY;
            }

            if (e.which == 3) {
                // override pos with non snapped pos no matter the alt press
                this.updateCurrentPos(false, e.xm, e.ym);

                // find nearest (limited to 10 pixels of) clicked wall
                var clickedWall = MapUtils.currentEntities('wall')
                    .map(wall => { return { w: wall, dist: IntMathUtils.getDistanceSQTo(wall.getLong('x1'), wall.getLong('y1'), wall.getLong('x2'), wall.getLong('y2'), this.currentX, this.currentY) } })
                    .filter(wwd => wwd.dist <= 10 * 10)
                    .sort((a, b) => a.dist - b.dist)
                    .map(wwd => wwd.w)[0];

                // open menu for selecting edit or delete
                if (clickedWall != null) {
                    this.menu = new EntityMenu(this.mode, new EntityReference(clickedWall), ServerData.isGM(), e.clientX, e.clientY);
                }
            }
        } else {
            if (e.which == 1 && MapUtils.currentMap() != null) {
                var newWall = new Entity('wall');
                newWall.setLong('x1', this.startX);
                newWall.setLong('y1', this.startY);
                newWall.setLong('x2', this.currentX);
                newWall.setLong('y2', this.currentY);
                newWall.setBoolean('seeThrough', this.seeThrough);
                newWall.setBoolean('door', this.door);
                newWall.setBoolean('oneSided', this.oneSided);
                MapUtils.currentMap().getContainedEntityManager('wall').add(newWall);

                this.startX = this.currentX;
                this.startY = this.currentY;
            }

            if (e.which == 3) {
                this.active = false;
            }
        }
    }

    mouseMoved(e) {
        this.updateCurrentPos(!e.ctrlKey, e.xm, e.ym);
    }

    updateCurrentPos(snap, x, y) {
        if (snap) {
            // snap to grid (set snap to true when control is NOT down)
            var map = MapUtils.currentMap();
            if (map) {
                x = Math.round(x / map.getLong('gridSize')) * map.getLong('gridSize');
                y = Math.round(y / map.getLong('gridSize')) * map.getLong('gridSize');
            }
        } else {
            // just snap to nearby wall end points
            var map = MapUtils.currentMap();
            if (map) {
                var wallSnapDist = 4;
                for (var wall of MapUtils.currentEntities('wall')) {
                    var dist1 = Math.abs(wall.getLong('x1') - x) + Math.abs(wall.getLong('y1') - y);
                    if (dist1 <= wallSnapDist + wallSnapDist) {
                        x = wall.getLong('x1');
                        y = wall.getLong('y1');
                        break;
                    }

                    var dist2 = Math.abs(wall.getLong('x2') - x) + Math.abs(wall.getLong('y2') - y);
                    if (dist2 <= wallSnapDist + wallSnapDist) {
                        x = wall.getLong('x2');
                        y = wall.getLong('y2');
                        break;
                    }
                }
            }
        }

        this.currentX = x;
        this.currentY = y;
    }
}