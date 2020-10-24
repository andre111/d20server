MapUtils = {
    currentMap: function() {
        var currentMap = ServerData.currentMap;
        return EntityManagers.get("map").find(currentMap);
    },
    
    currentEntities: function(type) {
        var currentMap = ServerData.currentMap;
        return _.chain(EntityManagers.get(type).all()).filter(e => Number(e.properties["map"].value) == currentMap); 
    },
    
    currentEntitiesInLayer: function(type, l) {
        return MapUtils.currentEntities(type).filter(e => e.properties["layer"].value == l);
    },
    
    currentEntitiesSorted: function(type, l) {
        return MapUtils.currentEntitiesInLayer(type, l).sortBy("id").sortBy(e => Number(e.properties["depth"].value));
    }
}
