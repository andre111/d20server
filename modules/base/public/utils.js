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
        ctx.rotate(token.prop("rotation").getLong() * Math.PI / 180);
    },
    
    getAABB: function(entity) {
        //TODO: implement
    }
}
