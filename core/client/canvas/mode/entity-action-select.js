import { EntityAction } from './entity-action.js';
import { EntityActionRotate } from './entity-action-rotate.js';
import { EntityActionResize } from './entity-action-resize.js';
import { EntityActionMove } from './entity-action-move.js';
import { EntityMenu } from './entity-menu.js';
import { CanvasWindowInput } from '../window/canvas-window-input.js';
import { EntityClipboard } from '../../entity/entity-clipboard.js';
import { EntityReference } from '../../entity/entity-reference.js';
import { ImageService } from '../../service/image-service.js';
import { ServerData } from '../../server-data.js';
import { TokenRenderer } from '../../renderer/token-renderer.js';
import { EntityUtils } from '../../util/entityutil.js';
import { MapUtils } from '../../util/maputil.js';
import { Access, Type } from '../../../common/constants.js';
import { Client } from '../../app.js';

class EntityActionSelectGizmo {
    constructor(widthMult, heightMult, xOffset, yOffset, renderSquare, onPress, requiredProperties) {
        this.widthMult = widthMult;
        this.heightMult = heightMult;
        this.xOffset = xOffset;
        this.yOffset = yOffset;
        this.renderSquare = renderSquare;
        this.onPress = onPress;
        this.requiredProperties = requiredProperties;
    }
    
    getX(reference) {
        return Math.trunc((reference.prop('width').getLong() * this.widthMult) + this.xOffset);
    }
    
    getY(reference) {
        return Math.trunc((reference.prop('height').getLong() * this.heightMult) + this.yOffset);
    }
    
    canUse(reference, profile) {
        var accessLevel = reference.getAccessLevel(profile);
        for(var requiredProperty of this.requiredProperties) {
            if(!Access.matches(reference.prop(requiredProperty).getEditAccess(), accessLevel)) {
                return false;
            }
        }
        return true;
    }
}
class EntityActionSelectPropertyBox extends EntityActionSelectGizmo {
    constructor(widthMult, heightMult, xOffset, yOffset) {
        super(widthMult, heightMult, xOffset, yOffset, false, (mode, mx, my) => {}, '');
    }
    
    getWidth() {
        return 58;
    }
    
    getHeight() {
        return 16;
    }
}
const EntityActionSelectGizmos = [
    // rotate
    new EntityActionSelectGizmo(0, -0.5, 0, -20, false, (mode, mx, my) => mode.setAction(new EntityActionRotate(mode)), ['rotation']),

    // resize
    new EntityActionSelectGizmo(-0.5, -0.5, 0, 0, true, (mode, mx, my) => mode.setAction(new EntityActionResize(mode, mx, my, -2, -2)), ['width', 'height']), // top left
    new EntityActionSelectGizmo(0, -0.5, 0, 0, true, (mode, mx, my) => mode.setAction(new EntityActionResize(mode, mx, my, 0, -2)), ['width', 'height']), // top middle
    new EntityActionSelectGizmo(0.5, -0.5, 0, 0, true, (mode, mx, my) => mode.setAction(new EntityActionResize(mode, mx, my, 2, -2)), ['width', 'height']), // top right

    new EntityActionSelectGizmo(-0.5, 0, 0, 0, true, (mode, mx, my) => mode.setAction(new EntityActionResize(mode, mx, my, -2, 0)), ['width', 'height']), // middle left
    new EntityActionSelectGizmo(0.5, 0, 0, 0, true, (mode, mx, my) => mode.setAction(new EntityActionResize(mode, mx, my, 2, 0)), ['width', 'height']), // middle right

    new EntityActionSelectGizmo(-0.5, 0.5, 0, 0, true, (mode, mx, my) => mode.setAction(new EntityActionResize(mode, mx, my, -2, 2)), ['width', 'height']), // bottom left
    new EntityActionSelectGizmo(0, 0.5, 0, 0, true, (mode, mx, my) => mode.setAction(new EntityActionResize(mode, mx, my, 0, 2)), ['width', 'height']), // bottom middle
    new EntityActionSelectGizmo(0.5, 0.5, 0, 0, true, (mode, mx, my) => mode.setAction(new EntityActionResize(mode, mx, my, 2, 2)), ['width', 'height']) // bottom right
];
const EntityActionSelectPropertyBoxes = [
    new EntityActionSelectPropertyBox(-0.5, -0.5, -6-58, 4),
    new EntityActionSelectPropertyBox(-0.5, -0.5, -6-58, 4+16+4),
    new EntityActionSelectPropertyBox(-0.5, -0.5, -6-58, 4+16+4+16+4),
    new EntityActionSelectPropertyBox(0.5, -0.5, 6, 4),
    new EntityActionSelectPropertyBox(0.5, -0.5, 6, 4+16+4),
    new EntityActionSelectPropertyBox(0.5, -0.5, 6, 4+16+4+16+4)
];

export class EntityActionSelect extends EntityAction {
    constructor(mode) {
        super(mode);
        
        this.selecting = false;
        this.selStartX = 0;
        this.selStartY = 0;
        this.selEndX = 0;
        this.selEndY = 0;
        
        this.menu = null;
    }
    
    init() {
        this.selecting = false;
    }
    
    exit() {
        if(this.menu != null) {
            this.menu.close();
            this.menu = null;
        }
    }
    
    renderOverlay(ctx) {
        this.mode.renderActiveEntities(ctx, false, true);
        
        if(this.mode.activeEntities.length == 1) {
            var reference = this.mode.activeEntities[0];
            
            // draw property boxes
            if(reference.prop('editBoxes') != null && reference.prop('editBoxes') != undefined) {
                var bounds = EntityUtils.getAABB(reference);
                
                var propertiesForBoxes = reference.prop('editBoxes').getString().split(',');
                var index = 0;
                for(var propertyForBox of propertiesForBoxes) {
                    var property = propertyForBox;
                    var label = '';
                    if(propertyForBox.includes(':')) {
                        property = propertyForBox.substring(0, propertyForBox.indexOf(':'));
                        label = propertyForBox.substring(propertyForBox.indexOf(':')+1);
                    }
                    
                    if(index >= EntityActionSelectPropertyBoxes.length) break;
                    if(reference.prop(property) != null && reference.prop(property) != undefined && reference.prop(property).getType() == Type.LONG) {
                        var propertyBox = EntityActionSelectPropertyBoxes[index++];
                        
                        var x = Math.trunc(bounds.x + bounds.width / 2 + bounds.width * propertyBox.widthMult + propertyBox.xOffset);
						var y = Math.trunc(bounds.y + bounds.height / 2 + bounds.height * propertyBox.heightMult + propertyBox.yOffset);
						var w = propertyBox.getWidth();
						var h = propertyBox.getHeight();
                        
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.59)';
                        ctx.font = '12px arial';
                        ctx.fillRect(x, y, w, h);
                        ctx.fillStyle = 'white';
                        
                        //TODO: remove hardcoded icons and replace with user selectable symbol(s)
						if(property == 'modAttack') { var img = ImageService.getInternalImage('/core/files/img/icon/attack.png'); if(img != null) ctx.drawImage(img, x+1, y+1, 14, 14); }
                        if(property == 'modDamage') { var img = ImageService.getInternalImage('/core/files/img/icon/damage.png'); if(img != null) ctx.drawImage(img, x+1, y+1, 14, 14); }
						ctx.fillText(label, x+4, y+12);
						
						var value = reference.prop(property).getLong();
						var valueString = value >= 0 ? '+'+value : ''+value;
						ctx.fillText(valueString, x+w-ctx.measureText(valueString).width-4, y+12);
                    }
                }
            }
            
            // render gizmos
            ctx.save();
            EntityUtils.applyTransform(ctx, reference);
            ctx.fillStyle = 'lime';
            for(var gizmo of EntityActionSelectGizmos) {
                if(!gizmo.canUse(reference, ServerData.localProfile)) continue;
                
                if(gizmo.renderSquare) {
                    ctx.fillRect(gizmo.getX(reference)-5, gizmo.getY(reference)-5, 10, 10);
                } else {
                    ctx.beginPath(),
                    ctx.ellipse(gizmo.getX(reference), gizmo.getY(reference), 5, 5, 0, 0, Math.PI*2);
                    ctx.fill();
                }
            }
            ctx.restore();
        }
        
        // draw selection box
        if(this.selecting) {
            ctx.strokeStyle = 'lightgray';
            ctx.lineWidth = 1;
            var selX1 = Math.min(this.selStartX, this.selEndX);
			var selY1 = Math.min(this.selStartY, this.selEndY);
			var selX2 = Math.max(this.selStartX, this.selEndX);
			var selY2 = Math.max(this.selStartY, this.selEndY);
			if(selX1 != selX2 || selY1 != selY2) {
				ctx.strokeRect(selX1, selY1, selX2-selX1, selY2-selY1);
			}
        }
    }
    
    
    mousePressed(e) {
        if(this.menu != null) {
            this.menu.close();
            this.menu = null;
        }
        
        if(e.which == 1) {
            if(this.mode.activeEntities.length > 0) {
                if(this.mode.activeEntities.length == 1) {
                    // check for press on gizmo and execute gizmo code and return early
                    var reference = this.mode.activeEntities[0];
                    var localPoint = EntityUtils.toLocalCoordinates(reference, e.xm, e.ym);
                    for(var gizmo of EntityActionSelectGizmos) {
                        if(!gizmo.canUse(reference, ServerData.localProfile)) continue;

						if(gizmo.getX(reference)-5 <= localPoint.x && localPoint.x <= gizmo.getX(reference)+5) {
							if(gizmo.getY(reference)-5 <= localPoint.y && localPoint.y <= gizmo.getY(reference)+5) {
								gizmo.onPress(this.mode, localPoint.x, localPoint.y);
								return;
							}
						}
                    }
                    
                    // property boxes
                    if(reference.prop('editBoxes') != null && reference.prop('editBoxes') != undefined) {
                        var bounds = EntityUtils.getAABB(reference);
                        
                        var propertiesForBoxes = reference.prop('editBoxes').getString().split(',');
                        var index = 0;
                        for(var propertyForBox of propertiesForBoxes) {
                            var property = propertyForBox;
                            if(propertyForBox.includes(':')) {
                                property = propertyForBox.substring(0, propertyForBox.indexOf(':'));
                            }
                            
                            if(index >= EntityActionSelectPropertyBoxes.length) break;
                            if(reference.prop(property) != null && reference.prop(property) != undefined && reference.prop(property).getType() == Type.LONG) {
                                var propertyBox = EntityActionSelectPropertyBoxes[index++];
                                
                                var x = Math.trunc(bounds.x + bounds.width / 2 + bounds.width * propertyBox.widthMult + propertyBox.xOffset);
                                var y = Math.trunc(bounds.y + bounds.height / 2 + bounds.height * propertyBox.heightMult + propertyBox.yOffset);
                                var w = propertyBox.getWidth();
                                var h = propertyBox.getHeight();
                                
                                if(x <= e.xm && e.xm <= x + w && y <= e.ym && e.ym <= y + h) {
                                    this.openLongPropertySetDialog(reference, property, false, 'Change '+property, 'Set '+property+':');
                                    return;
                                }
                            }
                        }
                    }
                }
                
                // check if this press happened on one of the selected tokens
				var insideSelection = false;
				for(var reference of this.mode.activeEntities) {
					if(EntityUtils.isPointInside(reference, e.xm, e.ym)) {
						insideSelection = true;
						break;
					}
				}
                
                // -> if yes check in which mode we need to switch move and return early
				if(insideSelection) {
					//TODO: check access levels for x and y for every token (and remove unallowed from list, cancel when list empty)
					this.mode.setAction(new EntityActionMove(this.mode, e.xm, e.ym));
					return;
				}
            }
            
            this.selecting = true;
            this.selStartX = this.selEndX = e.xm;
            this.selStartY = this.selEndY = e.ym;
        }
    }
    
    mouseReleased(e) {
        if(e.which == 1) {
            if(this.selecting) {
                this.selecting = false;
                var selX1 = Math.min(this.selStartX, this.selEndX);
				var selY1 = Math.min(this.selStartY, this.selEndY);
				var selX2 = Math.max(this.selStartX, this.selEndX);
				var selY2 = Math.max(this.selStartY, this.selEndY);

				// select (add as temp token) all tokens in the selection box
                if(selX1 != selX2 && selY1 != selY2) {
                    this.mode.clearActiveEntities();
                    MapUtils.currentEntitiesInLayer(this.mode.entityType, this.mode.layer).forEach(entity => {
                        if(this.canSelect(entity) && EntityUtils.isEntityInside(entity, selX1, selY1, selX2, selY2)) {
                            this.mode.addActiveEntity(entity);
                        }
                    }).value();
                    this.mode.storeMouseOffsets(e.xm, e.ym);
                } else {
                    //WEB CLIENT: moved from mouseClicked, because that has ordering issues
                    // special casing for tokens, can this be generalized?
                    if(this.mode.entityType == 'token') {
                        // -> change bar value //TODO: can this be simplified?
                        var viewer = Client.getState().getView().getProfile();
                        for(var token of MapUtils.currentEntitiesSorted(this.mode.entityType, this.mode.layer).value()) {
                            var accessLevel = token.getAccessLevel(viewer);
                            var bounds = EntityUtils.getAABB(token);
                            var tx = token.prop('x').getLong();
                            var ty = token.prop('y').getLong();
                            
                            for(var i=1; i<=3; i++) {
                                if(token.prop('bar'+i+'Current').canEdit(accessLevel) && TokenRenderer.isBarVisible(token, viewer, i)) {
                                    var bx = tx + TokenRenderer.getBarX(token, bounds, viewer, i);
                                    var by = ty + TokenRenderer.getBarY(token, bounds, viewer, i);
                                    
                                    if(bx <= e.xm && e.xm <= bx + TokenRenderer.getBarWidth(token, bounds, viewer) && by <= e.ym && e.ym <= by + TokenRenderer.getBarHeight(token, bounds, viewer)) {
                                        this.openLongPropertySetDialog(new EntityReference(token), 'bar'+i+'Current', true, 'Change Bar Value', 'Set Bar '+i+' value:');
                                        return;
                                    }
                                }
                            }
                        }
                    }
                    
                    // -> select single
                    this.selectLast(e.xm, e.ym);
                }
            }
        }
        
        //WEB CLIENT: moved from mouseClicked, because that has ordering issues
        if(e.which == 3) {
			// -> select single and open context menu
			this.selectLast(e.xm, e.ym);
            if(this.mode.activeEntities.length == 1) {
                this.menu = new EntityMenu(this.mode, this.mode.activeEntities[0], ServerData.isGM(), e.clientX, e.clientY);
            }
        }
    }
    
    mouseDragged(e) {
		this.mode.storeMouseOffsets(e.xm, e.ym);
        
        if(this.selecting) {
            this.selEndX = e.xm;
            this.selEndY = e.ym;
        }
    }
    
    mouseMoved(e) {
		this.mode.storeMouseOffsets(e.xm, e.ym);
    }
    
    actionPerformed(action) {
        if(action == 'copy') {
            this.doCopy();
        } else if(action == 'paste') {
            this.doPaste();
        } else if(action == 'set_view') {
            this.doSetView();
        }
    }
    
    canSelect(entity) {
        if(entity.getType() != this.mode.entityType) return false;
        if(entity.prop('layer').getLayer() != this.mode.layer) return false;
        
        if(entity.prop('alwaysSelectable') != null && entity.prop('alwaysSelectable') != undefined && entity.prop('alwaysSelectable').getBoolean()) return true;
        
        return Access.matches(Access.CONTROLLING_PLAYER, entity.getAccessLevel(ServerData.localProfile));
    }
    
    selectLast(x, y) {
        var map = MapUtils.currentMap();
        if(map == null || map == undefined) return;
        
        var toSelect = MapUtils.currentEntitiesSorted(this.mode.entityType, this.mode.layer)
                .filter(entity => this.canSelect(entity)).filter(entity => EntityUtils.isPointInside(entity, x, y))
                .last().value();
                
        this.mode.clearActiveEntities();
        if(toSelect != null && toSelect != undefined) {
            this.mode.addActiveEntity(toSelect);
        }
    }
    
    openLongPropertySetDialog(reference, property, allowRelative, title, message) {
        new CanvasWindowInput(title, message, reference.prop(property).getLong(), value => {
            if(value == null || value == undefined || value == '') return;
            
            var newValueString = value;
            var relative = allowRelative && (newValueString.startsWith('+') || newValueString.startsWith('-'));
            var newValue = Number(newValueString);
            if(newValue != NaN) {
                if(relative) newValue += reference.prop(property).getLong();
                
                reference.prop(property).setLong(newValue);
                reference.performUpdate();
            }
        });
    }
    
    doCopy() {
        if(this.mode.activeEntities.length > 0) {
            EntityClipboard.setEntities(this.mode.entityType, this.mode.activeEntities);
        }
    }
    
    doPaste() {
        var clipboardEntities = EntityClipboard.getEntities(this.mode.entityType);
        if(clipboardEntities.length > 0) {
            this.mode.setAddEntitiesAction(clipboardEntities);
        }
    }
    
    doSetView() {
        if(this.mode.entityType == 'token' && this.mode.activeEntities.length == 1 && Client.getState().getViewToken() <= 0) {
            Client.getState().setViewToken(this.mode.activeEntities[0].getID());
        } else {
            Client.getState().setViewToken(-1);
        }
    }
}
