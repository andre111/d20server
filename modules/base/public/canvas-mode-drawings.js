CanvasModeDrawingsGlobals = {
    color: "#FFFFFF"
};

class CanvasModeDrawings extends CanvasMode {
    constructor(layer) {
        super();
        
        this.action = "DRAW_RECT";
        
        this.startX = 0;
        this.startY = 0;
        this.currentDrawing = null;
        
        this.layer = layer;
    }
    
    setLayer(layer) {
        this.layer = layer;
    }
    
    renderOverlay(ctx) {
        if(this.currentDrawing != null) {
            DrawingRenderer.renderDrawing(ctx, this.currentDrawing);
        }
    }
    
    mousePressed(e) {
		// left click
        if(e.which == 1) {
            this.xStart = e.xm;
            this.yStart = e.ym;
            
            var map = MapUtils.currentMap();
            if(map == null || map == undefined) return;
            
            switch(this.action) {
            case "DRAW_RECT":
                this.currentDrawing = this.newDrawing(ServerData.localProfile, map, this.layer, this.xStart-1, this.yStart-1, 2, 2, 0, e.shiftKey ? "rectOutline" : "rect", CanvasModeDrawingsGlobals.color);
                break;
            case "DRAW_OVAL":
                this.currentDrawing = this.newDrawing(ServerData.localProfile, map, this.layer, this.xStart-1, this.yStart-1, 2, 2, 0, e.shiftKey ? "ovalOutline" : "oval", CanvasModeDrawingsGlobals.color);
                break;
            case "WRITE_TEXT":
                new CanvasWindowInput("Add Text", "Enter Text: ", "", text => {
                    if(text != null && text != undefined && text != "") {
                        EntityManagers.get("drawing").add(this.newDrawing(ServerData.localProfile, map, this.layer, this.xStart-16, this.yStart-16, DrawingRenderer.getTextWidth(text)+8, 40, 0, "text:"+text, CanvasModeDrawingsGlobals.color));
                    }
                });
                break;
            case "DELETE":
                var clickedDrawing = MapUtils.currentEntitiesSorted("drawing", this.layer).filter(drawing => {
                    return drawing.canEdit(ServerData.localProfile) && EntityUtils.isPointInside(drawing, e.xm, e.ym);
                }).last().value();
                if(clickedDrawing != null && clickedDrawing != undefined) {
                    EntityManagers.get("drawing").remove(clickedDrawing.id);
                }
                break;
            default:
                break;
            }
        }
        
        // right click
        if(e.which == 3) {
            this.currentDrawing = null;
        }
    }
    
    newDrawing(creator, map, layer, x, y, width, height, rotation, shape, color) {
        var drawing = Entity.create("drawing");
        
        drawing.prop("creator").setLong(creator.id);
		drawing.prop("map").setLong(map.id);
		
		drawing.prop("x").setLong(x);
		drawing.prop("y").setLong(y);
		drawing.prop("width").setLong(width);
		drawing.prop("height").setLong(height);
		drawing.prop("rotation").setDouble(rotation);
		drawing.prop("layer").setLayer(layer);
		
		drawing.prop("shape").setString(shape);
		drawing.prop("color").setColor(color);
		
		return drawing;
    }
    
    mouseReleased(e) {
        if(e.which == 1) {
            this.updateCurrentDrawing(e.xm, e.ym, e.ctrlKey, e.shiftKey);
            if(this.currentDrawing != null) {
                EntityManagers.get("drawing").add(this.currentDrawing);
                this.currentDrawing = null;
            }
        }
    }
    
    mouseDragged(e) {
		// update current Drawing
		this.updateCurrentDrawing(e.xm, e.ym, e.ctrlKey, e.shiftKey);
    }
    
    updateCurrentDrawing(xCurrent, yCurrent, forceSquare, modified) {
        if(this.currentDrawing != null) {
            var xDiff = xCurrent - this.xStart;
            var yDiff = yCurrent - this.yStart;
            var x, y, width, height;
            
            switch(this.action) {
            case "DRAW_RECT":
                if(forceSquare) {
                    if(Math.abs(xDiff) > Math.abs(yDiff)) yCurrent = Math.trunc(this.yStart + Math.sign(yDiff) * Math.abs(xDiff));
                    else xCurrent = Math.trunc(this.xStart + Math.sign(xDiff) * Math.abs(yDiff));
                    
                    xDiff = xCurrent - this.xStart;
                    yDiff = yCurrent - this.yStart;
                }
                x = (this.xStart + xCurrent) / 2;
				y = (this.yStart + yCurrent) / 2;
				width = Math.abs(xDiff);
				height = Math.abs(yDiff);
				this.currentDrawing.prop("shape").setString(modified ? "rectOutline" : "rect");
                break;
            case "DRAW_OVAL":
                xDiff = Math.abs(xDiff);
				yDiff = Math.abs(yDiff);
				if(forceSquare) {
					xDiff = yDiff = Math.max(xDiff, yDiff);
				}
				x = this.xStart;
				y = this.yStart;
				width = xDiff*2;
				height = yDiff*2;
				this.currentDrawing.prop("shape").setString(modified ? "ovalOutline" : "oval");
                break;
            default:
                return;
            }
            
			this.currentDrawing.prop("x").setLong(x);
			this.currentDrawing.prop("y").setLong(y);
			this.currentDrawing.prop("width").setLong(width);
			this.currentDrawing.prop("height").setLong(height);
        }
    }
    
    deleteAllDrawings() {
        new CanvasWindowConfirm("Delete Drawings", "Delete all (accessible) drawings on the current layer?", () => {
            var drawings = MapUtils.currentEntitiesInLayer("drawing", this.layer).filter(drawing => drawing.canEdit(ServerData.localProfile)).value();
            for(var drawing of drawings) {
                EntityManagers.get("drawing").remove(drawing.id);
            }
        });
    }
}
