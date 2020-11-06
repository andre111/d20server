class CMEntityAction extends MouseController {
    constructor(mode) {
        super();
        
        this.mode = mode;
    }
    
    init() {}
    renderOverlay(ctx) {}
    actionPerformed(action) {}
}

class CMEntityActionAdd extends CMEntityAction {
    constructor(mode) {
        super(mode);
    }
    
    renderOverlay(ctx) {
        this.mode.renderActiveEntities(ctx, true, false);
    }
    
    mouseClicked(e) {
        if(e.which == 1) {
            for(var reference of this.mode.activeEntities) {
                EntityManagers.get(this.mode.entityType).add(reference.getModifiedEntity());
            }
            this.mode.resetAction();
        } else if(e.which == 3) {
            this.mode.resetAction();
        }
    }
    
    mouseMoved(e) {
        this.mode.adjustPositions(e.xm, e.ym, !e.ctrlKey, false);
    }
    
    mouseDragged(e) {
        this.mode.adjustPositions(e.xm, e.ym, !e.ctrlKey, false);
    }
}

class CMEntityActionMove extends CMEntityAction {
    constructor(mode, mouseX, mouseY) {
        super(mode);
        
        this.mode.storeMouseOffsets(mouseX, mouseY);
    }
    
    doMove(mouseX, mouseY, snap, collideWithWalls) {
        this.mode.adjustPositions(mouseX, mouseY, snap, collideWithWalls);
    }
    
    finishMove() {
        for(var reference of this.mode.activeEntities) {
            reference.performUpdate();
        }
        this.mode.setAction(new CMEntityActionSelect(this.mode));
    }
    
    renderOverlay(ctx) {
        this.mode.renderActiveEntities(ctx, true, true);
    }
    
    mouseReleased(e) {
        if(e.which == 1) {
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

class CMEntityActionResize extends CMEntityAction {
    constructor(mode, mouseX, mouseY, widthMultiplier, heightMultiplier) {
        super(mode);
        
        this.widthMultiplier = widthMultiplier;
        this.heightMultiplier = heightMultiplier;
        
        // remember initial location
        var reference = this.mode.activeEntities[0];
        this.initialW = reference.prop("width").getLong();
        this.initialH = reference.prop("height").getLong();
        
        this.initialMouseX = mouseX;
        this.initialMouseY = mouseY;
    }
    
    renderOverlay(ctx) {
        this.mode.renderActiveEntities(ctx, true, true);
    }
    
    mouseReleased(e) {
        if(e.which == 1) {
            var reference = this.mode.activeEntities[0];
            reference.performUpdate();
            this.mode.setAction(new CMEntityActionSelect(this.mode));
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
        if(map == null || map == undefined) return;
        
        var localPoint = EntityUtils.toLocalCoordinates(this.mode.activeEntities[0], xm, ym);
        
        // calculate offset
        var xoffset = Math.trunc(localPoint.x - this.initialMouseX);
        var yoffset = Math.trunc(localPoint.y - this.initialMouseY);
        
        // (test) apply to values
		var w = this.initialW + xoffset * this.widthMultiplier;
		var h = this.initialH + yoffset * this.heightMultiplier;
		
		// limit to minimum 10 pixels size
		if(w < 10 && this.widthMultiplier != 0) {
			xoffset = (10 - this.initialW) / this.widthMultiplier;
		}
		if(h < 10 && this.heightMultiplier != 0) {
			yoffset = (10 - this.initialH) / this.heightMultiplier;
		}
		
		// (test) apply to values
		w = this.initialW + xoffset * this.widthMultiplier;
		h = this.initialH + yoffset * this.heightMultiplier;
        
        // snap to grid sizes (the complete size?)
		var gridSize = map.prop("gridSize").getLong();
		if(snap) {
			w = Math.round(w / gridSize) * gridSize;
			h = Math.round(h / gridSize) * gridSize;
			if(w == 0) w = gridSize;
			if(h == 0) h = gridSize;

			if(this.widthMultiplier != 0) xoffset = (w - this.initialW) / this.widthMultiplier;
			if(this.heightMultiplier != 0) yoffset = (h - this.initialH) / this.heightMultiplier;
		}
		
		// apply to values
		w = this.initialW + xoffset * this.widthMultiplier;
		h = this.initialH + yoffset * this.heightMultiplier;
        
        var reference = this.mode.activeEntities[0];
        reference.prop("width").setLong(w);
        reference.prop("height").setLong(h);
    }
}

class CMEntityActionRotate extends CMEntityAction {
    constructor(mode) {
        super(mode);
    }
    
    doRotation(xm, ym, snap) {
        var reference = this.mode.activeEntities[0];
        var rotation = 0;
        
        // calculate angle between mouse and upwards
		var angle = Math.atan2(xm-reference.prop("x").getLong(), ym-reference.prop("y").getLong());
		angle -= Math.PI;
		rotation -= angle;
        
        // convert back to degrees
		rotation = Math.round(rotation * 180 / Math.PI);
		
		// snap
		if(snap) {
			rotation = Math.round(rotation / 45) * 45;
		}
        
        rotation = rotation % 360;
		
		reference.prop("rotation").setDouble(rotation);
    }
    
    finishRotation() {
        for(var reference of this.mode.activeEntities) {
            reference.performUpdate();
        }
        this.mode.setAction(new CMEntityActionSelect(this.mode));
    }
    
    renderOverlay(ctx) {
        this.mode.renderActiveEntities(ctx, true, true);
    }
    
    mouseReleased(e) {
        if(e.which == 1) {
            this.finishRotation();
        }
    }
    
    mouseMoved(e) {
        this.doRotation(e.xm, e.ym, !e.ctrlKey);
    }
    
    mouseDragged(e) {
        this.doRotation(e.xm, e.ym, !e.ctrlKey);
    }
}

class CMEntityActionSelectGizmo {
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
        return Math.trunc((reference.prop("width").getLong() * this.widthMult) + this.xOffset);
    }
    
    getY(reference) {
        return Math.trunc((reference.prop("height").getLong() * this.heightMult) + this.yOffset);
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
class CMEntityActionSelectPropertyBox extends CMEntityActionSelectGizmo {
    constructor(widthMult, heightMult, xOffset, yOffset) {
        super(widthMult, heightMult, xOffset, yOffset, false, (mode, mx, my) => {}, "");
    }
    
    getWidth() {
        return 58;
    }
    
    getHeight() {
        return 16;
    }
}
CMEntityActionSelectGizmos = [
    // rotate
    new CMEntityActionSelectGizmo(0, -0.5, 0, -20, false, (mode, mx, my) => mode.setAction(new CMEntityActionRotate(mode)), ["rotation"]),

    // resize
    new CMEntityActionSelectGizmo(-0.5, -0.5, 0, 0, true, (mode, mx, my) => mode.setAction(new CMEntityActionResize(mode, mx, my, -2, -2)), ["width", "height"]), // top left
    new CMEntityActionSelectGizmo(0, -0.5, 0, 0, true, (mode, mx, my) => mode.setAction(new CMEntityActionResize(mode, mx, my, 0, -2)), ["width", "height"]), // top middle
    new CMEntityActionSelectGizmo(0.5, -0.5, 0, 0, true, (mode, mx, my) => mode.setAction(new CMEntityActionResize(mode, mx, my, 2, -2)), ["width", "height"]), // top right

    new CMEntityActionSelectGizmo(-0.5, 0, 0, 0, true, (mode, mx, my) => mode.setAction(new CMEntityActionResize(mode, mx, my, -2, 0)), ["width", "height"]), // middle left
    new CMEntityActionSelectGizmo(0.5, 0, 0, 0, true, (mode, mx, my) => mode.setAction(new CMEntityActionResize(mode, mx, my, 2, 0)), ["width", "height"]), // middle right

    new CMEntityActionSelectGizmo(-0.5, 0.5, 0, 0, true, (mode, mx, my) => mode.setAction(new CMEntityActionResize(mode, mx, my, -2, 2)), ["width", "height"]), // bottom left
    new CMEntityActionSelectGizmo(0, 0.5, 0, 0, true, (mode, mx, my) => mode.setAction(new CMEntityActionResize(mode, mx, my, 0, 2)), ["width", "height"]), // bottom middle
    new CMEntityActionSelectGizmo(0.5, 0.5, 0, 0, true, (mode, mx, my) => mode.setAction(new CMEntityActionResize(mode, mx, my, 2, 2)), ["width", "height"]) // bottom right
];
CMEntityActionSelectPropertyBoxes = [
    new CMEntityActionSelectPropertyBox(-0.5, -0.5, -6-58, 4),
    new CMEntityActionSelectPropertyBox(-0.5, -0.5, -6-58, 4+16+4),
    new CMEntityActionSelectPropertyBox(-0.5, -0.5, -6-58, 4+16+4+16+4),
    new CMEntityActionSelectPropertyBox(0.5, -0.5, 6, 4),
    new CMEntityActionSelectPropertyBox(0.5, -0.5, 6, 4+16+4),
    new CMEntityActionSelectPropertyBox(0.5, -0.5, 6, 4+16+4+16+4)
];

class CMEntityActionSelectMenu {
    constructor(mode, reference, isGM, x, y) {
        this.mode = mode;
        this.reference = reference;
        this.closed = false;
        
        var accessLevel = reference.getAccessLevel(ServerData.localProfile);
        
        // create html elements
        this.container = document.createElement("ul");
        this.container.style.position = "fixed";
        this.container.style.width = "150px";
        this.container.style.left = x+"px";
        this.container.style.top = y+"px";
        document.body.appendChild(this.container);
        
        this.createItem(this.container, "Edit", () => this.doEdit());
        
        if(this.mode.entityType == "token") {
            // sending macros
            if(Access.matches(reference.prop("macroUse").getAccessValue(), accessLevel)) {
                var macro = this.createCategory(this.container, "Macros");
                for(const [key, value] of Object.entries(reference.prop("macros").getStringMap())) {
                    this.createItem(macro, key, () => this.doSendMacro(key));
                }
            }
            
            // sending actor macros
            var actor = EntityManagers.get("actor").find(reference.prop("actorID").getLong());
            if(actor != null && actor != undefined) {
                var actorMacro = this.createCategory(this.container, "Actor Macros");
                
                //TODO: get and sort macros before adding to menu
                var macros = actor.getPredefinedMacros();
                
				// add macros to menu with categories
                var categories = new Map();
                for(const [key, value] of Object.entries(macros)) {
                    // find or create category sub menu
                    var parent = actorMacro;
                    var category = value.category;
                    if(category != null && category != undefined && category != "") {
                        if(!categories.has(category)) {
                            var cat = this.createCategory(actorMacro, category);
                            categories.set(category, cat);
                        }
                        parent = categories.get(category);
                    }
                    
                    // add macro entry
                    this.createItem(parent, value.displayName, () => this.doSendMacro("!"+key));
                }
            }
            
            // adding to lists
            //TODO: this is broken/the access check seems to be wrong somehow
            var list = this.createCategory(this.container, "Add to");
            _.chain(EntityManagers.get("token_list").all()).forEach(tokenList => {
                var listAccessLevel = TokenListUtils.getAccessLevel(ServerData.localProfile, tokenList, reference.getBackingEntity());
                if(tokenList.canEditWithAccess(listAccessLevel)) {
                    this.createItem(list, tokenList.prop("displayName").getString(), () => this.doTokenListInsert(tokenList));
                }
            }).value();
        }
        
        if(reference.prop("depth").canEdit(accessLevel)) {
            var move = this.createCategory(this.container, "Move");
            this.createItem(move, "to front", () => this.doMoveToFront());
            this.createItem(move, "to back", () => this.doMoveToBack());
        }
        
        // gm actions
        if(isGM) {
            if(this.mode.entityType == "token") {
                this.createItem(this.container, "Fit to Grid", () => this.doFitToGrid());
            }
            
            this.createItem(this.container, "Delete", () => this.doDelete());
        }
        
        $(this.container).menu({
            select: (event, ui) => {
                if(event.currentTarget.menucallback != null && event.currentTarget.menucallback != undefined) {
                    event.currentTarget.menucallback();
                    this.close();
                }
            }
        });
    }
    
    createItem(parent, name, callback) {
        var item = document.createElement("li");
        var div = document.createElement("div");
        div.innerHTML = name;
        item.appendChild(div);
        item.menucallback = callback;
        parent.appendChild(item);
    }
    
    createCategory(parent, name) {
        var category = document.createElement("li");
        var div = document.createElement("div");
        div.innerHTML = name;
        category.appendChild(div);
        var container = document.createElement("ul");
        container.style.width = "180px";
        category.appendChild(container);
        
        parent.appendChild(category);
        
        return container;
    }
    
    doEdit() {
        new CanvasWindowEditEntity(this.reference);
    }
    
    doSendMacro(macroName) {
        var msg = {
            msg: "SendChatMessage",
            message: "!"+macroName
        };
        MessageService.send(msg);
    }
    
    doTokenListInsert(tokenList) {
        var msg = {
            msg: "TokenListValue",
            listID: tokenList.id,
            tokenID: this.reference.id,
            value: 0,
            hidden: false,
            reset: false
        };
        MessageService.send(msg);
    }
    
    doMoveToFront() {
        var currentMinDepth = MapUtils.currentEntitiesInLayer(this.mode.entityType, this.mode.layer).map(e => e.prop("depth").getLong()).min().value();
        if(currentMinDepth == undefined) currentMinDepth = 0;
        this.reference.prop("depth").setLong(currentMinDepth-1);
        this.reference.performUpdate();
    }
    
    doMoveToBack() {
        var currentMaxDepth = MapUtils.currentEntitiesInLayer(this.mode.entityType, this.mode.layer).map(e => e.prop("depth").getLong()).max().value();
        if(currentMaxDepth == undefined) currentMaxDepth = 0;
        this.reference.prop("depth").setLong(currentMaxDepth+1);
        this.reference.performUpdate();
    }
    
    doFitToGrid() {
        new CanvasWindowFitToGrid(this.reference);
    }
    
    doDelete() {
        EntityManagers.get(this.mode.entityType).remove(this.reference.id);
        this.mode.activeEntities = [];
    }
    
    close() {
        if(this.closed) return;
        this.closed = true;
        document.body.removeChild(this.container);
    }
}

class CMEntityActionSelect extends CMEntityAction {
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
    
    renderOverlay(ctx) {
        this.mode.renderActiveEntities(ctx, false, true);
        
        if(this.mode.activeEntities.length == 1) {
            var reference = this.mode.activeEntities[0];
            
            // draw property boxes
            if(reference.prop("editBoxes") != null && reference.prop("editBoxes") != undefined) {
                var bounds = EntityUtils.getAABB(reference);
                
                var propertiesForBoxes = reference.prop("editBoxes").getString().split(",");
                var index = 0;
                for(var propertyForBox of propertiesForBoxes) {
                    var property = propertyForBox;
                    var label = "";
                    if(propertyForBox.includes(":")) {
                        property = propertyForBox.substring(0, propertyForBox.indexOf(":"));
                        label = propertyForBox.substring(propertyForBox.indexOf(":")+1);
                    }
                    
                    if(index >= CMEntityActionSelectPropertyBoxes.length) break;
                    if(reference.prop(property) != null && reference.prop(property) != undefined && reference.prop(property).getType() == Type.LONG) {
                        var propertyBox = CMEntityActionSelectPropertyBoxes[index++];
                        
                        var x = Math.trunc(bounds.x + bounds.width / 2 + bounds.width * propertyBox.widthMult + propertyBox.xOffset);
						var y = Math.trunc(bounds.y + bounds.height / 2 + bounds.height * propertyBox.heightMult + propertyBox.yOffset);
						var w = propertyBox.getWidth();
						var h = propertyBox.getHeight();
                        
                        ctx.fillStyle = "rgba(0, 0, 0, 0.59)";
                        ctx.font = "12px arial";
                        ctx.fillRect(x, y, w, h);
                        ctx.fillStyle = "white";
                        
                        //TODO: remove hardcoded icons and replace with user selectable symbol(s)
						if(property == "modAttack") { var img = ImageService.getInternalImage("/public/img/icon/attack.png"); if(img != null) ctx.drawImage(img, x+1, y+1, 14, 14); }
                        if(property == "modDamage") { var img = ImageService.getInternalImage("/public/img/icon/damage.png"); if(img != null) ctx.drawImage(img, x+1, y+1, 14, 14); }
						ctx.fillText(label, x+4, y+12);
						
						var value = reference.prop(property).getLong();
						var valueString = value >= 0 ? "+"+value : ""+value;
						ctx.fillText(valueString, x+w-ctx.measureText(valueString).width-4, y+12);
                    }
                }
            }
            
            // render gizmos
            ctx.save();
            EntityUtils.applyTransform(ctx, reference);
            ctx.fillStyle = "lime";
            for(var gizmo of CMEntityActionSelectGizmos) {
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
            ctx.strokeStyle = "lightgray";
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
                    for(var gizmo of CMEntityActionSelectGizmos) {
                        if(!gizmo.canUse(reference, ServerData.localProfile)) continue;

						if(gizmo.getX(reference)-5 <= localPoint.x && localPoint.x <= gizmo.getX(reference)+5) {
							if(gizmo.getY(reference)-5 <= localPoint.y && localPoint.y <= gizmo.getY(reference)+5) {
								gizmo.onPress(this.mode, localPoint.x, localPoint.y);
								return;
							}
						}
                    }
                    
                    // property boxes
                    if(reference.prop("editBoxes") != null && reference.prop("editBoxes") != undefined) {
                        var bounds = EntityUtils.getAABB(reference);
                        
                        var propertiesForBoxes = reference.prop("editBoxes").getString().split(",");
                        var index = 0;
                        for(var propertyForBox of propertiesForBoxes) {
                            var property = propertyForBox;
                            if(propertyForBox.includes(":")) {
                                property = propertyForBox.substring(0, propertyForBox.indexOf(":"));
                            }
                            
                            if(index >= CMEntityActionSelectPropertyBoxes.length) break;
                            if(reference.prop(property) != null && reference.prop(property) != undefined && reference.prop(property).getType() == Type.LONG) {
                                var propertyBox = CMEntityActionSelectPropertyBoxes[index++];
                                
                                var x = Math.trunc(bounds.x + bounds.width / 2 + bounds.width * propertyBox.widthMult + propertyBox.xOffset);
                                var y = Math.trunc(bounds.y + bounds.height / 2 + bounds.height * propertyBox.heightMult + propertyBox.yOffset);
                                var w = propertyBox.getWidth();
                                var h = propertyBox.getHeight();
                                
                                if(x <= e.xm && e.xm <= x + w && y <= e.ym && e.ym <= y + h) {
                                    this.openLongPropertySetDialog(reference, property, false, "Change "+property, "Set "+property+":");
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
					this.mode.setAction(new CMEntityActionMove(this.mode, e.xm, e.ym));
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
                    if(this.mode.entityType == "token") {
                        // -> change bar value //TODO: can this be simplified?
                        var viewer = StateMain.view.getProfile();
                        for(var token of MapUtils.currentEntitiesSorted(this.mode.entityType, this.mode.layer).value()) {
                            var accessLevel = token.getAccessLevel(viewer);
                            var bounds = EntityUtils.getAABB(token);
                            var tx = token.prop("x").getLong();
                            var ty = token.prop("y").getLong();
                            
                            for(var i=1; i<=3; i++) {
                                if(token.prop("bar"+i+"Current").canEdit(accessLevel) && TokenRenderer.isBarVisible(token, viewer, i)) {
                                    var bx = tx + TokenRenderer.getBarX(token, bounds, viewer, i);
                                    var by = ty + TokenRenderer.getBarY(token, bounds, viewer, i);
                                    
                                    if(bx <= e.xm && e.xm <= bx + TokenRenderer.getBarWidth(token, bounds, viewer) && by <= e.ym && e.ym <= by + TokenRenderer.getBarHeight(token, bounds, viewer)) {
                                        this.openLongPropertySetDialog(EntityReference.create(token), "bar"+i+"Current", true, "Change Bar Value", "Set Bar "+i+" value:");
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
                this.menu = new CMEntityActionSelectMenu(this.mode, this.mode.activeEntities[0], ServerData.isGM(), e.clientX, e.clientY);
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
        if(action == InputService.COPY) {
            this.doCopy();
        } else if(action == InputService.PASTE) {
            this.doPaste();
        } else if(action == InputService.SET_VIEW) {
            this.doSetView();
        }
    }
    
    canSelect(entity) {
        if(entity.getType() != this.mode.entityType) return false;
        if(entity.prop("layer").getLayer() != this.mode.layer) return false;
        
        if(entity.prop("alwaysSelectable") != null && entity.prop("alwaysSelectable") != undefined && entity.prop("alwaysSelectable").getBoolean()) return true;
        
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
            if(value == null || value == undefined || value == "") return;
            
            var newValueString = value;
            var relative = allowRelative && (newValueString.startsWith("+") || newValueString.startsWith("-"));
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
        if(this.mode.entityType == "token" && this.mode.activeEntities.length == 1 && StateMain.viewToken <= 0) {
            StateMain.viewToken = this.mode.activeEntities[0].id;
        } else {
            StateMain.viewToken = -1;
        }
    }
    //TODO...
}

//TODO: implement
class CanvasModeEntities extends CanvasMode {
    constructor(entityType, layer) {
        super();
        
        this.entityType = entityType;
        this.layer = layer;
        
        this.action = new CMEntityActionSelect(this);
        this.activeEntities = [];
    }
    
    init() {
        this.setAction(new CMEntityActionSelect(this));
        this.activeEntities = [];
        this.sendSelectedTokens();
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
        
        var gridSize = map.prop("gridSize").getLong();
        
        // moving tokens
        if(a == InputService.MOVE_LEFT) {
            var moveAction = new CMEntityActionMove(this, 0, 0);
            moveAction.doMove(-gridSize, 0, false, true);
            moveAction.finishMove();
        } else if(a == InputService.MOVE_RIGHT) {
            var moveAction = new CMEntityActionMove(this, 0, 0);
            moveAction.doMove(gridSize, 0, false, true);
            moveAction.finishMove();
        } else if(a == InputService.MOVE_UP) {
            var moveAction = new CMEntityActionMove(this, 0, 0);
            moveAction.doMove(0, -gridSize, false, true);
            moveAction.finishMove();
        } else if(a == InputService.MOVE_DOWN) {
            var moveAction = new CMEntityActionMove(this, 0, 0);
            moveAction.doMove(0, gridSize, false, true);
            moveAction.finishMove();
        // rotating tokens
        } else if(a == InputService.ROTATE_LEFT) {
            if(this.activeEntities.length == 1) {
                var reference = this.activeEntities[0];
                var rotation = reference.prop("rotation").getDouble();
                rotation = (rotation - 45) % 360;
				reference.prop("rotation").setDouble(rotation);
				reference.performUpdate();
            }
        } else if(a == InputService.ROTATE_RIGHT) {
            if(this.activeEntities.length == 1) {
                var reference = this.activeEntities[0];
                var rotation = reference.prop("rotation").getDouble();
                rotation = (rotation + 45) % 360;
				reference.prop("rotation").setDouble(rotation);
				reference.performUpdate();
            }
        // any other input -> pass along to action
        } else {
            this.action.actionPerformed(a);
        }
    }
    
    addActiveEntity(entity) {
        if(entity == null || entity == undefined) return;
        
        var reference = EntityReference.create(entity);
        this.activeEntities.push(reference);
        this.sendSelectedTokens();
    }
    
    validateActiveEntities() {
        this.activeEntities = _.chain(this.activeEntities).filter(reference => reference.isValid()).value();
    }
    
    clearActiveEntities() {
        this.activeEntities = [];
        this.sendSelectedTokens();
    }
    
    renderActiveEntities(ctx, drawNormal, drawSelectionOutline) {
        for(var reference of this.activeEntities) {
            var entity = reference.getModifiedEntity();
            if(entity == null || entity == undefined) continue;
            
            if(drawNormal) {
                if(StateMain.entityRenderers[this.entityType]) {
                    StateMain.entityRenderers[this.entityType].render(ctx, StateMain.view, entity);
                }
            }
            
            if(drawSelectionOutline) {
                ctx.save();
                EntityUtils.applyTransform(ctx, entity);
                
                ctx.strokeStyle = "lime";
                ctx.lineWidth = 3;
                ctx.strokeRect(-entity.prop("width").getLong()/2, -entity.prop("height").getLong()/2, entity.prop("width").getLong(), entity.prop("height").getLong());
                
                ctx.restore();
            }
        }
    }
    
    storeMouseOffsets(xm, ym) {
		// remember offset from mouse
        for(var reference of this.activeEntities) {
            reference.mouseOffsetX = reference.prop("x").getLong() - xm;
            reference.mouseOffsetY = reference.prop("y").getLong() - ym;
        }
    }
    
    adjustPositions(xm, ym, snap, collideWithWalls) {
        var map = MapUtils.currentMap();
        if(map == null || map == undefined) return;
        
		var gridSize = map.prop("gridSize").getLong();
        
        for(var reference of this.activeEntities) {
            // determine new position
			var xp = xm + reference.mouseOffsetX;
			var yp = ym + reference.mouseOffsetY;
			if(snap) {
				xp = xm + Math.round(reference.mouseOffsetX / gridSize) * gridSize;
				yp = ym + Math.round(reference.mouseOffsetY / gridSize) * gridSize;
				
				xp = Math.ceil(xp / gridSize) * gridSize - gridSize/2;
				yp = Math.ceil(yp / gridSize) * gridSize - gridSize/2;
			}
            
            // collide with walls
			var doMove = true;
			if(collideWithWalls) {
                MapUtils.currentEntities("wall").forEach(wall => {
                    if(IntMathUtils.doLineSegmentsIntersect(reference.prop("x").getLong(), reference.prop("y").getLong(), xp, yp, 
						wall.prop("x1").getLong(), wall.prop("y1").getLong(), wall.prop("x2").getLong(), wall.prop("y2").getLong())) {
						doMove = false;
					}
                }).value();
			}
			
			// move temp token
			if(doMove) {
				reference.prop("x").setLong(xp);
				reference.prop("y").setLong(yp);
			}
        }
    }
    
    resetAction() {
        this.activeEntities = [];
        this.sendSelectedTokens();
        
        this.setAction(new CMEntityActionSelect(this));
    }
    
    setAction(action) {
        this.action = action;
        this.action.init();
    }
    
    setAddEntityAction(entity) {
		var map = MapUtils.currentMap();
		if(map == null) return;
		if(entity.getType() != this.entityType) return;
        
        entity = entity.clone();
        entity.id = 0;
        entity.prop("map").setLong(map.id);
        entity.prop("layer").setLayer(this.layer);
        
        this.activeEntities = [];
        this.sendSelectedTokens();
        
        this.activeEntities.push(EntityReference.create(entity));
        this.setAction(new CMEntityActionAdd(this));
    }
    setAddEntitiesAction(references) {
        var map = MapUtils.currentMap();
        if(map == null || map == undefined) return;
        
        this.activeEntities = [];
        this.sendSelectedTokens();
        
        for(var reference of references) {
            if(reference.getType() == this.entityType) {
                reference.prop("map").setLong(map.id);
                reference.prop("layer").setLayer(this.layer);
                this.activeEntities.push(reference);
            }
        }
        
        this.setAction(new CMEntityActionAdd(this));
    }
    
    sendSelectedTokens() {
        if(this.entityType == "token") {
            var msg = {
                msg: "SelectedTokens",
                selectedTokens: _.chain(this.activeEntities).map(ref => ref.id).value()
            };
            MessageService.send(msg);
        }
    }
}
