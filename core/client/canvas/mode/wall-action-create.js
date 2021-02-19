import { WallAction } from './wall-action.js';
import { WallMenu } from './wall-menu.js';
import { MapUtils } from '../../util/maputil.js';
import { ServerData } from '../../server-data.js'; 

import { Entity } from '../../../common/common.js';
import { EntityManagers } from '../../../common/entity/entity-managers.js';
import { EntityReference } from '../../../common/entity/entity-reference.js';
import { IntMathUtils } from '../../../common/util/mathutil.js';

export class WallActionCreate extends WallAction {
    constructor(mode, seeThrough, door) {
        super(mode);
        
        this.seeThrough = seeThrough;
        this.door = door;
        
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.active = false;
    }
    
    exit() {
        if(this.menu != null) {
            this.menu.close();
            this.menu = null;
        }
    }
    
    renderOverlay(ctx) {
        if(this.active) {
            ctx.strokeStyle = this.seeThrough ? 'cyan' : 'lime';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(this.startX, this.startY);
            ctx.lineTo(this.currentX, this.currentY);
            ctx.stroke();
        }
    }
    
    mousePressed(e) {
        if(this.menu != null) {
            this.menu.close();
            this.menu = null;
        }
    }
    
    mouseClicked(e) {
        this.updateCurrentPos(!e.ctrlKey, e.xm, e.ym);
        
        if(!this.active) {
            if(e.which == 1) {
                this.active = true;
                this.startX = this.currentX;
                this.startY = this.currentY;
            }
            
            if(e.which == 3) {
				// override pos with non snapped pos no matter the alt press
                this.updateCurrentPos(false, e.xm, e.ym);
                
                // find nearest (limited to 10 pixels of) clicked wall
                var clickedWall = MapUtils.currentEntities('wall')
                    .map(wall => { return { w: wall, dist: IntMathUtils.getDistanceSQTo(wall.prop('x1').getLong(), wall.prop('y1').getLong(), wall.prop('x2').getLong(), wall.prop('y2').getLong(), this.currentX, this.currentY) } })
                    .filter(wwd => wwd.dist <= 10*10)
                    .sortBy('dist')
                    .map(wwd => wwd.w)
                    .head().value();
                
                // open menu for selecting edit or delete
				if(clickedWall != null) {
                    this.menu = new WallMenu(this.mode, new EntityReference(clickedWall), ServerData.isGM(), e.clientX, e.clientY);
				}
            }
        } else {
            if(e.which == 1 && MapUtils.currentMap() != null) {
                var newWall = new Entity('wall');
                newWall.prop('map').setLong(MapUtils.currentMap().id);
				newWall.prop('x1').setLong(this.startX);
				newWall.prop('y1').setLong(this.startY);
				newWall.prop('x2').setLong(this.currentX);
				newWall.prop('y2').setLong(this.currentY);
				newWall.prop('seeThrough').setBoolean(this.seeThrough);
                newWall.prop('door').setBoolean(this.door);
                EntityManagers.get('wall').add(newWall);
                
                this.startX = this.currentX;
                this.startY = this.currentY;
            }
            
            if(e.which == 3) {
                this.active = false;
            }
        }
    }
    
    mouseMoved(e) {
        this.updateCurrentPos(!e.ctrlKey, e.xm, e.ym);
    }
    
    updateCurrentPos(snap, x, y) {
        if(snap) {
			// snap to grid (set snap to true when control is NOT down)
            var map = MapUtils.currentMap();
            if(map != null && map != undefined) {
                x = Math.round(x / map.prop('gridSize').getLong()) * map.prop('gridSize').getLong();
                y = Math.round(y / map.prop('gridSize').getLong()) * map.prop('gridSize').getLong();
            }
        } else {
            // just snap to nearby wall end points
            var map = MapUtils.currentMap();
            if(map != null && map != undefined) {
                var wallSnapDist = 4;
                for(var wall of MapUtils.currentEntities('wall').value()) {
                    var dist1 = Math.abs(wall.prop('x1').getLong() - x) + Math.abs(wall.prop('y1').getLong() - y);
					if(dist1 <= wallSnapDist+wallSnapDist) {
						x = wall.prop('x1').getLong();
						y = wall.prop('y1').getLong();
						break;
					}

					var dist2 = Math.abs(wall.prop('x2').getLong() - x) + Math.abs(wall.prop('y2').getLong() - y);
					if(dist2 <= wallSnapDist+wallSnapDist) {
						x = wall.prop('x2').getLong();
						y = wall.prop('y2').getLong();
						break;
					}
                }
            }
        }
        
        this.currentX = x;
        this.currentY = y;
    }
}