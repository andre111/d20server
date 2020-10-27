WallRenderer = {
    hasToRenderWalls: function(walls, viewport, viewer) {
        var minX = viewport.x;
        var maxX = viewport.x + viewport.width;
        var minY = viewport.y;
        var maxY = viewport.y + viewport.height;
        
        for(var wall of walls.value()) {
            if(!wall.prop("seeThrough").getBoolean() && IntMathUtils.getClippedLine(wall.prop("x1").getLong(), wall.prop("y1").getLong(), wall.prop("x2").getLong(), wall.prop("y2").getLong(), minX, maxX, minY, maxY) != null) return true;
		}
        return false;
    },
    
    calculateWalls: function(walls, viewport, viewers) {
        var cpr = new ClipperLib.Clipper();
        
        var combined = null;
        for(var viewer of viewers) {
            // create view for single viewer
            var localCombined = [];
            for(var wall of walls) {
                if(!wall.prop("seeThrough").getBoolean()) {
                    var poly = WallRenderer.calculateOccolusionPolygon(viewport, wall, viewer.prop("x").getLong(), viewer.prop("y").getLong());
                    if(poly != null && poly != undefined) {
                        //localCombined = union(localCombined, poly);
                        var result = new ClipperLib.Paths();
                        cpr.Clear();
                        cpr.AddPaths(localCombined, ClipperLib.PolyType.ptSubject, true);
                        cpr.AddPath(poly, ClipperLib.PolyType.ptClip, true);
                        cpr.Execute(ClipperLib.ClipType.ctUnion, result);
                        localCombined = result;
                    }
                }
            }
            
            // combine all viewers
            if(combined == null) {
                combined = localCombined;
            } else {
                //combined = intersection(combined, localCombined);
                var result = new ClipperLib.Paths();
                cpr.Clear();
                cpr.AddPaths(combined, ClipperLib.PolyType.ptSubject, true);
                cpr.AddPaths(localCombined, ClipperLib.PolyType.ptClip, true);
                cpr.Execute(ClipperLib.ClipType.ctIntersection, result);
                combined = result;
            }
        }
        return combined;
    },
    renderPrecalculatedWallRender: function(ctx, pwr) {
        if(pwr == null || pwr == undefined) return;
        
        ctx.fillStyle = "black";
        RenderUtils.addPaths(ctx, pwr);
        ctx.fill();
    },
    
    calculateOccolusionPolygon: function(viewport, wall, viewerX, viewerY) {
        var minX = Math.trunc(viewport.x);
		var maxX = Math.trunc(viewport.x + viewport.width);
		var minY = Math.trunc(viewport.y);
		var maxY = Math.trunc(viewport.y + viewport.height);
		
		// extend viewport to include viewer (causes missing occlusion when viewer is outside otherwise)
		if(minX >= viewerX) minX = viewerX-1;
		if(maxX <= viewerX) maxX = viewerX+1;
		if(minY >= viewerY) minY = viewerY-1;
		if(maxY <= viewerY) maxY = viewerY+1;

		// clip to inside viewport and discard outside walls
		var clippedWall = IntMathUtils.getClippedLine(wall.prop("x1").getLong(), wall.prop("y1").getLong(), wall.prop("x2").getLong(), wall.prop("y2").getLong(), minX, maxX, minY, maxY);
		if(clippedWall == null) return null;

		var x1 = Math.trunc(clippedWall.x1);
		var y1 = Math.trunc(clippedWall.y1);
		var x2 = Math.trunc(clippedWall.x2);
		var y2 = Math.trunc(clippedWall.y2);

		// project points to screen
		// calculate direction
		var dx1 = x1 - viewerX;
		var dy1 = y1 - viewerY;
		var dx2 = x2 - viewerX;
		var dy2 = y2 - viewerY;
		// calculate distance to edge for the coordinates
		var distX1 = Math.abs(viewerX - (dx1 < 0 ? minX : maxX));
		var distY1 = Math.abs(viewerY - (dy1 < 0 ? minY : maxY));
		var distX2 = Math.abs(viewerX - (dx2 < 0 ? minX : maxX));
		var distY2 = Math.abs(viewerY - (dy2 < 0 ? minY : maxY));
		// calculate factor
		var c1 = Math.min(distX1 / Math.abs(dx1), distY1 / Math.abs(dy1));
		var c2 = Math.min(distX2 / Math.abs(dx2), distY2 / Math.abs(dy2));
		if(c1<1 || c2<1) return null;
		// calculate projected values
		var px1 = Math.round(viewerX + dx1 * c1);
		var py1 = Math.round(viewerY + dy1 * c1);
		var px2 = Math.round(viewerX + dx2 * c2);
		var py2 = Math.round(viewerY + dy2 * c2);

		// adjust to edges if near enough for rounding errors
		if(Math.abs(px1-minX)<=1) px1 = minX;
		if(Math.abs(px1-maxX)<=1) px1 = maxX;
		if(Math.abs(py1-minY)<=1) py1 = minY;
		if(Math.abs(py1-maxY)<=1) py1 = maxY;
		if(Math.abs(px2-minX)<=1) px2 = minX;
		if(Math.abs(px2-maxX)<=1) px2 = maxX;
		if(Math.abs(py2-minY)<=1) py2 = minY;
		if(Math.abs(py2-maxY)<=1) py2 = maxY;
		
		// create polygon
		var poly = []
		// add start point
		poly.push({ X: x1, Y: y1 });
		// add first projected point
		poly.push({ X: px1, Y: py1 });
		// add viewport corners if needed by moving around the edges
		var isLeft = IntMathUtils.isPointLeftOfLine(x1, y1, x2, y2, viewerX, viewerY);
		var lastx = px1;
		var lasty = py1;
		if(isLeft) {
			// viewer left of wall -> counterclockwise
			var done = false;
			for(var i=0; i<2; i++) {
				if(lasty==minY && !done) {
					if(py2==minY) done = true;
					else poly.push({ X: lastx = minX, Y: lasty = minY });
				}
				if(lastx==minX && !done) {
					if(px2==minX) done = true;
					else poly.push({ X: lastx = minX, Y: lasty = maxY });
				}
				if(lasty==maxY && !done) {
					if(py2==maxY && !done) done = true;
					else poly.push({ X: lastx = maxX, Y: lasty = maxY });
				}
				if(lastx==maxX && !done) {
					if(px2==maxX && !done) done = true;
					else poly.push({ X: lastx = maxX, Y: lasty = minY });
				}
			}
		} else {
			// viewer right of wall -> clockwise
			var done = false;
			for(var i=0; i<2; i++) {
				if(lastx==minX && !done) {
					if(px2==minX) done = true;
					else poly.push({ X: lastx = minX, Y: lasty = minY });
				}
				if(lasty==minY && !done) {
					if(py2==minY) done = true;
					else poly.push({ X: lastx = maxX, Y: lasty = minY });
				}
				if(lastx==maxX && !done) {
					if(px2==maxX) done = true;
					else poly.push({ X: lastx = maxX, Y: lasty = maxY });
				}
				if(lasty==maxY && !done) {
					if(py2==maxY) done = true;
					else poly.push({ X: lastx = minX, Y: lasty = maxY });
				}
			}
		}
		// add second projected point
		poly.push({ X: px2, Y: py2 });
		// add end point
		poly.push({ X: x2, Y: y2 });

		return poly;
    }
}
