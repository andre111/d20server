EntityManagers = {
    _managers: {},
    _definitions: null,
    
    init: function(definitions) {
        EntityManagers.definitions = definitions;
        
        // create entity manager for every type
        for(const key of Object.keys(definitions.entityDefinitions)) {
            EntityManagers._managers[key] = new EntityManager(key);
            console.log("Created EntityManager for: "+key)
        }
    },
    
    get: function(type) {
        return EntityManagers._managers[type];
    }
}

//TODO: Listeners
class EntityManager {
    constructor(type) {
        this.type = type;
        this.entities = new Map();
    }
    
    find(id) {
        return this.entities.get(Number(id));
    }
    
    has(id) {
        return this.entities.has(Number(id));
    }
    
    all() {
        return Array.from(this.entities.values()); //TODO: might need the readOnlyAll system from current client
    }
    
    map() {
        return this.entities; //TODO: should be an unmodifiable view
    }
    
    add(entity) {
        //TODO: send AddEntity message
    }
    
    remove(id) {
        //TODO: send RemoveEntity message
    }
    
    updateProperties(id, map) {
        //TODO: send UpdateEntityProperties message
    }
    
    serverClearEntities() {
        this.entities.clear();
    }
    
    serverAddEntity(entity) {
        this.entities.set(Number(entity.id), entity);
    }
    
    serverRemoveEntity(id) {
        this.entities.delete(Number(id));
    }
    
    serverUpdateProperties(id, map) {
        var entity = this.find(id);
        if(entity == null || entity == undefined) return;
        
        //TODO: improve/complete implementation
        for(const [key, value] of Object.entries(map)) {
            var ownProperty = entity.properties[key];
            if(ownProperty == null || ownProperty == undefined) {
                //TODO: actual clone + addPropertyIfAbsentOrWrong
                ownProperty = value;
                entity.properties[key] = ownProperty;
            }
            
            // transfer value
            //TODO: actual property methods
            if(ownProperty.type == value.type) {
                ownProperty.value = value.value;
            }
            
            // transfer access
            ownProperty.viewAccess = value.viewAccess;
            ownProperty.editAccess = value.editAccess;
        }
    }
}
