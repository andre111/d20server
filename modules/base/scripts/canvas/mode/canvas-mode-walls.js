class CanvasModeWalls extends CanvasMode {
    constructor() {
        super();
        
        this.action = "NONE";
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.seeThrough = false;
    }
    
    init() {
        this.action = "NONE";
    }
    
    renderOverlay(ctx) {
        if(this.action == "CREATE_WALLS") {
            ctx.strokeStyle = this.seeThrough ? "cyan" : "lime";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(this.startX, this.startY);
            ctx.lineTo(this.currentX, this.currentY);
            ctx.stroke();
        }
    }
    
    mouseClicked(e) {
        this.updateCurrentPos(!e.ctrlKey, e.xm, e.ym, e.shiftKey);
        
        if(this.action == "NONE") {
            if(e.which == 1) {
                this.action = "CREATE_WALLS";
                this.startX = this.currentX;
                this.startY = this.currentY;
            }
            
            if(e.which == 3) {
				// override pos with non snapped pos no matter the alt press
                this.updateCurrentPos(false, e.xm, e.ym, e.shiftKey);
                
                // find nearest (limited to 10 pixels of) clicked wall
                var clickedWall = MapUtils.currentEntities("wall")
                    .map(wall => { return { w: wall, dist: IntMathUtils.getDistanceSQTo(wall.prop("x1").getLong(), wall.prop("y1").getLong(), wall.prop("x2").getLong(), wall.prop("y2").getLong(), this.currentX, this.currentY) } })
                    .filter(wwd => wwd.dist <= 10*10)
                    .sortBy("dist")
                    .map(wwd => wwd.w)
                    .head().value();
                
                // remove wall
				if(clickedWall != null) {
					EntityManagers.get("wall").remove(clickedWall.id);
				}
            }
        } else if(this.action == "CREATE_WALLS") {
            if(e.which == 1 && MapUtils.currentMap() != null) {
                var newWall = Entity.create("wall");
                newWall.prop("map").setLong(MapUtils.currentMap().id);
				newWall.prop("x1").setLong(this.startX);
				newWall.prop("y1").setLong(this.startY);
				newWall.prop("x2").setLong(this.currentX);
				newWall.prop("y2").setLong(this.currentY);
				newWall.prop("seeThrough").setBoolean(e.shiftKey);
                EntityManagers.get("wall").add(newWall);
                
                this.startX = this.currentX;
                this.startY = this.currentY;
            }
            
            if(e.which == 3) {
                this.action = "NONE";
            }
        }
    }
    
    mouseMoved(e) {
        this.updateCurrentPos(!e.ctrlKey, e.xm, e.ym, e.shiftKey);
    }
    
    updateCurrentPos(snap, x, y, seeThrough) {
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
        this.seeThrough = seeThrough;
    }
}
