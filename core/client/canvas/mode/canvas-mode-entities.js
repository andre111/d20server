import { CanvasMode } from '../canvas-mode.js';
import { EntityActionAdd } from './entity-action-add.js';
import { EntityActionMove } from './entity-action-move.js';
import { EntityActionSelect } from './entity-action-select.js';
import { MapUtils } from '../../util/maputil.js';
import { EntityUtils } from '../../util/entityutil.js';
import { MessageService } from '../../service/message-service.js';
import { Client } from '../../app.js';

import { IntMathUtils } from '../../../common/util/mathutil.js';
import { SelectedEntities } from '../../../common/messages.js';
import { Entity } from '../../../common/common.js';
import { EntityReference } from '../../../common/entity/entity-reference.js';
import { CanvasWindowConfirm } from '../window/canvas-window-confirm.js';
import { EntityManagers } from '../../../common/entity/entity-managers.js';

export class CanvasModeEntities extends CanvasMode {
    constructor(entityType, layer) {
        super();
        
        this.entityType = entityType;
        this.layer = layer;
        
        this.action = new EntityActionSelect(this);
        this.activeEntities = []; // mode registers listeners -> never modify activeEntities directly, use clearActiveEntities or verifyActiveEntities
    }
    
    init() {
        this.setAction(new EntityActionSelect(this));
        this.clearActiveEntities();
        this.sendSelectedEntities();
    }
    
    exit() {
        this.clearActiveEntities();
        this.action.exit();
    }
    
    setLayer(layer) {
        this.layer = layer;
        this.init();
    }
    
    renderOverlay(ctx) {
        this.validateActiveEntities();
        this.action.renderOverlay(ctx);
    }
    
    mouseClicked(e) {
        this.validateActiveEntities();
        this.action.mouseClicked(e);
    }
    
    mousePressed(e) {
        this.validateActiveEntities();
        this.action.mousePressed(e);
    }
    
    mouseReleased(e) {
        this.validateActiveEntities();
        this.action.mouseReleased(e);
    }
    
    mouseEntered(e) {
        this.validateActiveEntities();
        this.action.mouseEntered(e);
    }
    
    mouseExited(e) {
        this.validateActiveEntities();
        this.action.mouseExited(e);
    }
    
    mouseDragged(e) {
        this.validateActiveEntities();
        this.action.mouseDragged(e);
    }
    
    mouseMoved(e) {
        this.validateActiveEntities();
        this.action.mouseMoved(e);
    }
    
    mouseWheelMoved(e) {
        this.validateActiveEntities();
        this.action.mouseWheelMoved(e);
    }
    
    actionPerformed(a) {
        var map = MapUtils.currentMap();
        if(map == null || map == undefined) return;
        this.validateActiveEntities();
        
        var gridSize = map.prop('gridSize').getLong();
        
        // moving entities
        if(a == 'move_left') {
            var moveAction = new EntityActionMove(this, 0, 0);
            moveAction.doMove(-gridSize, 0, false, true);
            moveAction.finishMove();
        } else if(a == 'move_right') {
            var moveAction = new EntityActionMove(this, 0, 0);
            moveAction.doMove(gridSize, 0, false, true);
            moveAction.finishMove();
        } else if(a == 'move_up') {
            var moveAction = new EntityActionMove(this, 0, 0);
            moveAction.doMove(0, -gridSize, false, true);
            moveAction.finishMove();
        } else if(a == 'move_down') {
            var moveAction = new EntityActionMove(this, 0, 0);
            moveAction.doMove(0, gridSize, false, true);
            moveAction.finishMove();
        // rotating entities
        } else if(a == 'rotate_left') {
            if(this.activeEntities.length == 1) {
                var reference = this.activeEntities[0];
                var rotation = reference.prop('rotation').getDouble();
                rotation = (rotation - 45) % 360;
				reference.prop('rotation').setDouble(rotation);
				reference.performUpdate();
            }
        } else if(a == 'rotate_right') {
            if(this.activeEntities.length == 1) {
                var reference = this.activeEntities[0];
                var rotation = reference.prop('rotation').getDouble();
                rotation = (rotation + 45) % 360;
				reference.prop('rotation').setDouble(rotation);
				reference.performUpdate();
            }
        // deleting entities
        } else if(a == 'delete') {
            if(this.activeEntities.length > 0) {
                new CanvasWindowConfirm('Delete Object(s)', 'Do you want to delete all selected objects?', () => {
                    for(const reference of this.activeEntities) {
                        EntityManagers.get(this.entityType).remove(reference.getID());
                    }
                    this.clearActiveEntities();
                });
            }
        // any other input -> pass along to action
        } else {
            this.action.actionPerformed(a);
        }
    }
    
    addActiveEntity(entity) {
        if(entity == null || entity == undefined) return;
        if(!(entity instanceof Entity) && !(entity instanceof EntityReference)) return;

        const reference = entity instanceof EntityReference ? entity : new EntityReference(entity);
        this.activeEntities.push(reference);
        this.sendSelectedEntities();

        // add listener to update reference on changes 
        // -> should fix "simultaneous" movement glitching/bugs (TODO: might need some more work, this does not seem to be 100% fixed)
        // -> NEEDS to be removed again -> never modify activeEntities directly, use clearActiveEntities or validateActiveEntities
        reference.addListener(this);
    }
    
    validateActiveEntities() {
        //TODO: remove lodash
        this.activeEntities = _.chain(this.activeEntities).filter(reference => {
            if(reference.isValid()) {
                return true;
            } else {
                // IMPORTANT: unregister listener to prevent memory leaks -> never modify activeEntities directly, use clearActiveEntities or validateActiveEntities
                reference.removeListener(this);
                return false;
            }
        }).value();
    }
    
    clearActiveEntities() {
        // IMPORTANT: unregister all listeners to prevent memory leaks -> never modify activeEntities directly, use clearActiveEntities or validateActiveEntities
        for(const activeEntity of this.activeEntities) {
            activeEntity.removeListener(this);
        }

        this.activeEntities = [];
        this.sendSelectedEntities();
    }
    
    renderActiveEntities(ctx, drawNormal, drawSelectionOutline) {
        for(const reference of this.activeEntities) {
            var entity = reference.getModifiedEntity();
            if(entity == null || entity == undefined) continue;
            
            if(drawNormal) {
                //TODO: entity renders should be better accessible?
                if(Client.getState().entityRenderers[this.entityType]) {
                    Client.getState().entityRenderers[this.entityType].render(ctx, Client.getState().getView(), entity);
                }
            }
            
            if(drawSelectionOutline) {
                ctx.save();
                EntityUtils.applyTransform(ctx, entity);
                
                ctx.strokeStyle = 'lime';
                ctx.lineWidth = 3;
                ctx.strokeRect(-entity.prop('width').getLong()/2, -entity.prop('height').getLong()/2, entity.prop('width').getLong(), entity.prop('height').getLong());
                
                ctx.restore();
            }
        }
    }
    
    storeMouseOffsets(xm, ym) {
		// remember offset from mouse
        for(const reference of this.activeEntities) {
            reference.mouseOffsetX = reference.prop('x').getLong() - xm;
            reference.mouseOffsetY = reference.prop('y').getLong() - ym;
        }
    }
    
    adjustPositions(xm, ym, snap, collideWithWalls) {
        var map = MapUtils.currentMap();
        if(map == null || map == undefined) return;
        
		var gridSize = map.prop('gridSize').getLong();
        
        for(const reference of this.activeEntities) {
            // determine new position
			var xp = xm + reference.mouseOffsetX;
			var yp = ym + reference.mouseOffsetY;
			if(snap) {
                // check where to snap to, default -> center of cells
                var xoffset = -gridSize/2;
                var yoffset = -gridSize/2;

                // when the entity is (about) a multiple of 2 cells wide -> corner of cells
                const aabb = EntityUtils.getAABB(reference);
                const wp = Math.round(aabb.width / gridSize);
                const hp = Math.round(aabb.height / gridSize);
                if(wp > 1 && wp % 2 == 0) xoffset = 0;
                if(hp > 1 && hp % 2 == 0) yoffset = 0;

                // do actual snapping
				xp = Math.ceil(xp / gridSize) * gridSize + xoffset;
				yp = Math.ceil(yp / gridSize) * gridSize + yoffset;
			}
            xp = Math.trunc(xp);
            yp = Math.trunc(yp);
            
            // collide with walls
			var doMove = true;
			if(collideWithWalls) {
                MapUtils.currentEntities('wall').forEach(wall => {
                    if(!wall.prop('door').getBoolean() || !wall.prop('open').getBoolean()) {
                        if(IntMathUtils.doLineSegmentsIntersect(reference.prop('x').getLong(), reference.prop('y').getLong(), xp, yp, 
                            wall.prop('x1').getLong(), wall.prop('y1').getLong(), wall.prop('x2').getLong(), wall.prop('y2').getLong())) {
                            doMove = false;
                        }
                    }
                }).value();
			}
			
			// move temp token
			if(doMove) {
				reference.prop('x').setLong(xp);
				reference.prop('y').setLong(yp);
			}
        }
    }
    
    resetAction() {
        this.clearActiveEntities();
        this.sendSelectedEntities();
        
        this.setAction(new EntityActionSelect(this));
    }
    
    setAction(action) {
        this.action.exit();
        this.action = action;
        this.action.init();
    }
    
    setAddEntityAction(entity) {
		var map = MapUtils.currentMap();
		if(map == null) return;
		if(entity.getType() != this.entityType) return;
        
        entity = entity.clone();
        entity.id = 0;
        entity.prop('map').setLong(map.id);
        entity.prop('layer').setLayer(this.layer);
        
        this.clearActiveEntities();
        this.sendSelectedEntities();
        
        this.addActiveEntity(entity);
        this.setAction(new EntityActionAdd(this));
    }
    setAddEntitiesAction(references) {
        var map = MapUtils.currentMap();
        if(map == null || map == undefined) return;
        
        this.clearActiveEntities();
        this.sendSelectedEntities();
        
        for(const reference of references) {
            if(reference.getType() == this.entityType) {
                reference.prop('map').setLong(map.id);
                reference.prop('layer').setLayer(this.layer);
                this.addActiveEntity(reference);
            }
        }
        
        this.setAction(new EntityActionAdd(this));
    }
    
    sendSelectedEntities() {
        const msg = new SelectedEntities(this.entityType, _.chain(this.activeEntities).map(ref => ref.getID()).value());
        MessageService.send(msg);
    }
}
