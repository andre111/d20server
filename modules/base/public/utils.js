MapUtils = {
    currentMap: function() {
        var currentMap = ServerData.currentMap;
        return EntityManagers.get("map").find(currentMap);
    },
    
    currentEntities: function(type) {
        var currentMap = ServerData.currentMap;
        return _.chain(EntityManagers.get(type).all()).filter(e => e.prop("map").getLong() == currentMap); 
    },
    
    currentEntitiesInLayer: function(type, l) {
        return MapUtils.currentEntities(type).filter(e => e.prop("layer").value == l); //TODO: use getLayer
    },
    
    currentEntitiesSorted: function(type, l) {
        return MapUtils.currentEntitiesInLayer(type, l).sortBy("id").sortBy(e => e.prop("depth").getLong());
    }
},

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
}
