MapUtils = {
    currentMap: function() {
        var currentMap = ServerData.currentMap.get();
        return EntityManagers.get("map").find(currentMap);
    },
    
    currentEntities: function(type) {
        var currentMap = ServerData.currentMap.get();
        return _.chain(EntityManagers.get(type).all()).filter(e => e.prop("map").getLong() == currentMap); 
    },
    
    currentEntitiesInLayer: function(type, l) {
        return MapUtils.currentEntities(type).filter(e => e.prop("layer").value == l); //TODO: use getLayer
    },
    
    currentEntitiesSorted: function(type, l) {
        return MapUtils.currentEntitiesInLayer(type, l).sortBy(e => -e.id).sortBy(e => -e.prop("depth").getLong());
    },
    
    findControllableTokens: function(profile) {
        var controllableTokens = [];
        MapUtils.currentEntitiesSorted("token", Layer.MAIN).forEach(token => {
            if(token.getControllingPlayers().includes(profile.id)) {
                controllableTokens.push(token);
            }
        }).value();
        return controllableTokens;
    }
};

EntityUtils = {
    applyTransform: function(ctx, entity) {
        ctx.translate(entity.prop("x").getLong(), entity.prop("y").getLong());
        ctx.rotate(entity.prop("rotation").getLong() * Math.PI / 180);
    },
    
    getTransform: function(entity) {
        return compose(
            translate(entity.prop("x").getLong(), entity.prop("y").getLong()),
            rotate(entity.prop("rotation").getLong() * Math.PI / 180)
        );
    },
    
    toLocalCoordinates: function(entity, x, y) {
        return applyToPoint(inverse(EntityUtils.getTransform(entity)), { x: x, y: y });
    },
    
    isPointInside: function(entity, x, y) {
        var point = EntityUtils.toLocalCoordinates(entity, x, y);
        
		if(point.x < -entity.prop("width").getLong()/2) return false;
		if(point.x > +entity.prop("width").getLong()/2) return false;
		if(point.y < -entity.prop("height").getLong()/2) return false;
		if(point.y > +entity.prop("height").getLong()/2) return false;
		
		return true;
    },
    
    getAABB: function(entity) {
        var transform = EntityUtils.getTransform(entity);
        var p1 = { x: -entity.prop("width").getLong()/2, y: -entity.prop("height").getLong()/2 };
        var p2 = { x: -entity.prop("width").getLong()/2, y: entity.prop("height").getLong()/2 };
        var p3 = { x: entity.prop("width").getLong()/2, y: -entity.prop("height").getLong()/2 };
        var p4 = { x: entity.prop("width").getLong()/2, y: entity.prop("height").getLong()/2 };
        
        p1 = applyToPoint(transform, p1);
        p2 = applyToPoint(transform, p2);
        p3 = applyToPoint(transform, p3);
        p4 = applyToPoint(transform, p4);
        
        var x1 = Math.min(Math.min(Math.min(p1.x, p2.x), p3.x), p4.x);
		var y1 = Math.min(Math.min(Math.min(p1.y, p2.y), p3.y), p4.y);
		var x2 = Math.max(Math.max(Math.max(p1.x, p2.x), p3.x), p4.x);
		var y2 = Math.max(Math.max(Math.max(p1.y, p2.y), p3.y), p4.y);
        
        return new CRect(x1, y1, x2-x1, y2-y1);
    },
    
    isEntityInside: function(entity, x1, y1, x2, y2) {
        var bounds = EntityUtils.getAABB(entity);
        
		return x1 <= bounds.x && bounds.x + bounds.width <= x2 && y1 <= bounds.y && bounds.y + bounds.height <= y2;
    }
};

IntMathUtils = {
    doLineSegmentsIntersect: function(x11, y11, x12, y12, x21, y21, x22, y22) {
		return IntMathUtils.doAABBsIntersect(Math.min(x11, x12), Math.min(y11, y12), Math.max(x11, x12), Math.max(y11, y12),
				Math.min(x21, x22), Math.min(y21, y22), Math.max(x21, x22), Math.max(y21, y22))
				&& IntMathUtils.lineSegmentIntersectsLine(x11, y11, x12, y12, x21, y21, x22, y22)
				&& IntMathUtils.lineSegmentIntersectsLine(x21, y21, x22, y22, x11, y11, x12, y12);
	},
    
    lineSegmentIntersectsLine: function(x11, y11, x12, y12, x21, y21, x22, y22) {
		if (IntMathUtils.isPointOnLine(x11, y11, x12, y12, x21, y21))
			return true;
		if (IntMathUtils.isPointOnLine(x11, y11, x12, y12, x22, y22))
			return true;

		var firstleft = IntMathUtils.isPointLeftOfLine(x11, y11, x12, y12, x21, y21);
		var secondLeft = IntMathUtils.isPointLeftOfLine(x11, y11, x12, y12, x22, y22);

		return (firstleft && !secondLeft) || (!firstleft && secondLeft);
	},
    
    doAABBsIntersect: function(x11, y11, x12, y12, x21, y21, x22, y22) {
        return x11 <= x22 && x12 >= x21 && y11 <= y22 && y12 >= y21;
    },
    
    isPointOnLine: function(x1, y1, x2, y2, xp, yp) {
		// transform so x1/y1 is origin
		xp -= x1;
		yp -= y1;
		x2 -= x1;
		y2 -= y1;
		x1 = 0;
		y1 = 0;

		// test
		var r = IntMathUtils.crossProduct(x2, y2, xp, yp);
		return r == 0;
	},
    
    isPointLeftOfLine: function(x1, y1, x2, y2, xp, yp) {
		// transform so x1/y1 is origin
		xp -= x1;
		yp -= y1;
		x2 -= x1;
		y2 -= y1;
		x1 = 0;
		y1 = 0;

		// test
		var r = IntMathUtils.crossProduct(x2, y2, xp, yp);
		return r < 0;
	},
    
    crossProduct: function(x1, y1, x2, y2) {
		return x1 * y2 - x2 * y1;
	},
    
    doAABBCircleIntersect: function(x1, y1, x2, y2, cx, cy, r) {
		var xp = Math.max(x1, Math.min(cx, x2));
		var yp = Math.max(y1, Math.min(cy, y2));
		var xdist = Math.abs(cx-xp);
		var ydist = Math.abs(cy-yp);
		
		return ((xdist*xdist) + (ydist*ydist)) <= (r * r);
	},
    
    getClippedLine: function(x1, y1, x2, y2, minX, maxX, minY, maxY) {
        // check aabb
		var wxmin = Math.min(x1, x2);
		var wymin = Math.min(y1, y2);
		var wxmax = Math.max(x1, x2);
		var wymax = Math.max(y1, y2);
		if(!IntMathUtils.doAABBsIntersect(minX, minY, maxX, maxY, wxmin, wymin, wxmax, wymax)) return null;
		
		// using Liang-Barsky clipping
		var t0 = 0.0;    
		var t1 = 1.0;
		var xdelta = x2-x1;
		var ydelta = y2-y1;
	    var p = 0;
        var q = 0;
        var r = 0;

	    for(var edge=0; edge<4; edge++) {   // Traverse through left, right, bottom, top edges.
	        if (edge==0) {  p = -xdelta;    q = -(minX-x1);  }
	        if (edge==1) {  p = xdelta;     q =  (maxX-x1); }
	        if (edge==2) {  p = -ydelta;    q = -(minY-y1);}
	        if (edge==3) {  p = ydelta;     q =  (maxY-y1);   }   
	        r = q/p;
	        if(p==0 && q<0) return null;   // Don't draw line at all. (parallel line outside)

	        if(p<0) {
	            if(r>t1) return null;         // Don't draw line at all.
	            else if(r>t0) t0=r;            // Line is clipped!
	        } else if(p>0) {
	            if(r<t0) return null;      // Don't draw line at all.
	            else if(r<t1) t1=r;         // Line is clipped!
	        }
	    }

	    return { x1: Math.round(x1 + t0*xdelta), y1: Math.round(y1 + t0*ydelta), x2: Math.round(x1 + t1*xdelta), y2: Math.round(y1 + t1*ydelta) };
    },
    
    getDistanceSQTo: function(x1, y1, x2, y2, x, y) {
		var lengthSQ = (x2-x1) * (x2-x1) + (y2-y1) * (y2-y1);
		if(lengthSQ == 0) return (x1-x) * (x1-x) + (y1-y) * (y1-y); //xy1==xy2 -> distance point to point
		
		// project onto line
		var t = ((x-x1) * (x2-x1) + (y-y1) * (y2-y1)) / lengthSQ;
		// limit to line segment
		t = Math.max(0, Math.min(t, 1));
		var xp = x1 + t * (x2 - x1);
		var yp = y1 + t * (y2 - y1);
		
		// calculate distance
		return (x-xp) * (x-xp) + (y-yp) * (y-yp);
	},
    
    getRandomInt: function(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }
};

RenderUtils = {
    addPaths(ctx, paths) {
        ctx.beginPath();
        for(var path of paths) {
            var first = true;
            for(var point of path) {
                if(first) {
                    ctx.moveTo(point.X, point.Y);
                    first = false;
                } else {
                    ctx.lineTo(point.X, point.Y);
                }
            }
            ctx.closePath();
        }
    }
};

TokenListUtils = {
    getAccessLevel: function(profile, list, token) {
        if(token != null && token != undefined) {
            return token.getAccessLevel(profile);
        }
        
        if(profile.role == Role.GM) return Access.GM;
        return Access.EVERYONE;
    }
};
