class CMWallsAction extends MouseController {
    constructor(mode) {
        super();
        
        this.mode = mode;
    }
    
    init() {}
    exit() {}
    renderOverlay(ctx) {}
    actionPerformed(action) {}
}

class CMWallsActionSelectMenu {
    constructor(mode, reference, isGM, x, y) {
        // only allow gm access to walls
        if(isGM) {
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
            
            if(this.reference.prop("door").getBoolean()) {
                if(this.reference.prop("open").getBoolean()) this.createItem(this.container, "Close Door", () => this.doOpen(false));
                else this.createItem(this.container, "Open Door", () => this.doOpen(true));
                
                if(this.reference.prop("locked").getBoolean()) this.createItem(this.container, "Unlock Door", () => this.doLock(false));
                else this.createItem(this.container, "Lock Door", () => this.doLock(true));
            }
            
            this.createItem(this.container, "Delete", () => this.doDelete());
            
            $(this.container).menu({
                select: (event, ui) => {
                    if(event.currentTarget.menucallback != null && event.currentTarget.menucallback != undefined) {
                        event.currentTarget.menucallback();
                        this.close();
                    }
                }
            });
        }
    }
    
    createItem(parent, name, callback) {
        var item = document.createElement("li");
        var div = document.createElement("div");
        div.innerHTML = name;
        item.appendChild(div);
        item.menucallback = callback;
        parent.appendChild(item);
    }
    
    doEdit() {
        new CanvasWindowEditEntity(this.reference);
    }
    
    doOpen(open) {
        this.reference.prop("open").setBoolean(open);
        this.reference.performUpdate();
    }
    
    doLock(lock) {
        this.reference.prop("locked").setBoolean(lock);
        this.reference.performUpdate();
    }
    
    doDelete() {
        EntityManagers.get("wall").remove(this.reference.id);
        this.mode.activeEntities = [];
    }
    
    close() {
        if(this.closed) return;
        this.closed = true;
        document.body.removeChild(this.container);
    }
}

class CMWallsActionCreate extends CMWallsAction {
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
            ctx.strokeStyle = this.seeThrough ? "cyan" : "lime";
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
                var clickedWall = MapUtils.currentEntities("wall")
                    .map(wall => { return { w: wall, dist: IntMathUtils.getDistanceSQTo(wall.prop("x1").getLong(), wall.prop("y1").getLong(), wall.prop("x2").getLong(), wall.prop("y2").getLong(), this.currentX, this.currentY) } })
                    .filter(wwd => wwd.dist <= 10*10)
                    .sortBy("dist")
                    .map(wwd => wwd.w)
                    .head().value();
                
                // open menu for selecting edit or delete
				if(clickedWall != null) {
                    this.menu = new CMWallsActionSelectMenu(this.mode, EntityReference.create(clickedWall), ServerData.isGM(), e.clientX, e.clientY);
				}
            }
        } else {
            if(e.which == 1 && MapUtils.currentMap() != null) {
                var newWall = Entity.create("wall");
                newWall.prop("map").setLong(MapUtils.currentMap().id);
				newWall.prop("x1").setLong(this.startX);
				newWall.prop("y1").setLong(this.startY);
				newWall.prop("x2").setLong(this.currentX);
				newWall.prop("y2").setLong(this.currentY);
				newWall.prop("seeThrough").setBoolean(this.seeThrough);
                newWall.prop("door").setBoolean(this.door);
                EntityManagers.get("wall").add(newWall);
                
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
                x = Math.round(x / map.prop("gridSize").getLong()) * map.prop("gridSize").getLong();
                y = Math.round(y / map.prop("gridSize").getLong()) * map.prop("gridSize").getLong();
            }
        } else {
            // just snap to nearby wall end points
            var map = MapUtils.currentMap();
            if(map != null && map != undefined) {
                var wallSnapDist = 4;
                for(var wall of MapUtils.currentEntities("wall").value()) {
                    var dist1 = Math.abs(wall.prop("x1").getLong() - x) + Math.abs(wall.prop("y1").getLong() - y);
					if(dist1 <= wallSnapDist+wallSnapDist) {
						x = wall.prop("x1").getLong();
						y = wall.prop("y1").getLong();
						break;
					}

					var dist2 = Math.abs(wall.prop("x2").getLong() - x) + Math.abs(wall.prop("y2").getLong() - y);
					if(dist2 <= wallSnapDist+wallSnapDist) {
						x = wall.prop("x2").getLong();
						y = wall.prop("y2").getLong();
						break;
					}
                }
            }
        }
        
        this.currentX = x;
        this.currentY = y;
    }
}

class CMWallsActionCreateWall extends CMWallsActionCreate {
    constructor(mode) {
        super(mode, false, false);
    }
}

class CMWallsActionCreateWindow extends CMWallsActionCreate {
    constructor(mode) {
        super(mode, true, false);
    }
}

class CMWallsActionCreateDoor extends CMWallsActionCreate {
    constructor(mode) {
        super(mode, false, true);
    }
}

class CanvasModeWalls extends CanvasMode {
    constructor() {
        super();
        
        this.action = new CMWallsActionCreateWall(this);
    }
    
    init() {
        this.setAction(new CMWallsActionCreateWall(this));
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
        if(map == null || map == undefined) return;
        
        this.action.actionPerformed(a);
    }
    
    resetAction() {
        this.setAction(new CMWallsActionCreateWall(this));
    }
    
    setAction(action) {
        this.action.exit();
        this.action = action;
        this.action.init();
    }
}
