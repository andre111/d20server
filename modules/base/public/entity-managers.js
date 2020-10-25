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
};

Entity = {
    addMethods: function(entity) {
        // TODO: add methods
        entity.prop = Entity.prop;
        entity.getAccessLevel = Entity.getAccessLevel;
    },
    
    create: function(type) {
        //TODO: create new entity with id+type+default properties
    },
    
    prop: function(name) {
        var property = this.properties[name];
        Property.addMethods(property);
        return property;
    },
    
    getAccessLevel: function(viewer) {
        //TODO: implement
        return Access.GM;
    }
};

Property = {
    addMethods: function(property) {
        //TODO: add property methods?
        property.canView = Property.canView;
        property.canEdit = Property.canEdit;
        
        property.checkType = Property.checkType;
        
        property.getInternal = Property.getInternal;
        property.setInternal = Property.setInternal;
        
        property.getString = Property.getString;
        property.setString = Property.setString;
        property.getLong = Property.getLong;
        property.setLong = Property.setLong;
        property.getBoolean = Property.getBoolean;
        property.setBoolean = Property.setBoolean;
        property.getDouble = Property.getDouble;
        property.setDouble = Property.setDouble;
    },
    
    canView: function(accessLevel) {
        return Access.matches(this.viewAccess, accessLevel);
    },
    
    canEdit: function(accessLevel) {
        return Access.matches(this.editAccess, accessLevel);
    },
    
    checkType: function(type) {
        if(this.type != type) {
            //TODO: implement?
        }
    },
    
    getInternal: function() {
        return this.value;
    },
    setInternal: function(value) {
        if(this.value == value) return;
        
        this.value = value;
        //TODO: notify holder?
    },
    
    //TODO: the set methods need to check type of provided value
    getString: function() {
        this.checkType(Type.STRING);
        return this.getInternal();
    },
    setString: function(value) {
        this.checkType(Type.STRING);
        this.setInternal(value);
    },
    getLong: function() {
        this.checkType(Type.LONG);
        return Number(this.getInternal()); //TODO: cast/round to long?
    },
    setLong: function(value) {
        this.checkType(Type.LONG);
        this.setInternal(String(value));
    },
    getBoolean: function() {
        this.checkType(Type.BOOLEAN);
        return this.getInternal() == 'true';
    },
    setBoolean: function(value) {
        this.checkType(Type.BOOLEAN);
        this.setInternal(String(value));
    },
    getDouble: function() {
        this.checkType(Type.DOUBLE);
        return Number(this.getInternal());
    },
    setDouble: function(value) {
        this.checkType(Type.DOUBLE);
        this.setInternal(String(value));
    },
    //TODO: remaining type functions
};

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
        Entity.addMethods(entity);
        
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
