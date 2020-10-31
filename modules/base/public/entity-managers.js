EntityManagers = {
    _managers: {},
    _definitions: null,
    
    init: function(definitions) {
        EntityManagers._definitions = definitions;
        
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
        entity.getType = Entity.getType;
        entity.getDefinition = Entity.getDefinition;
        entity.getActiveExtensions = Entity.getActiveExtensions;
        entity.getPropertyDefinition = Entity.getPropertyDefinition;
        entity.addDefaultProperties = Entity.addDefaultProperties;
        entity.addPropertiesFromDefs = Entity.addPropertiesFromDefs;
        entity.addPropertyIfAbsentOrWrong = Entity.addPropertyIfAbsentOrWrong;
        entity.getPredefinedMacros = Entity.getPredefinedMacros;
        entity.addPredefinedMacros = Entity.addPredefinedMacros;
        
        entity.prop = Entity.prop;
        entity.getViewAccess = Entity.getViewAccess;
        entity.getEditAccess = Entity.getEditAccess;
        entity.getAccessLevel = Entity.getAccessLevel;
        entity.canView = Entity.canView;
        entity.canEdit = Entity.canEdit;
        entity.canViewWithAccess = Entity.canViewWithAccess;
        entity.canEditWithAccess = Entity.canEditWithAccess;
        //...
        entity.getControllingPlayers = Entity.getControllingPlayers;
        entity.clone = Entity.clone;
    },
    
    create: function(type) {
        var entity = {
            id: 0,
            type: type,
            properties: {}
        };
        Entity.addMethods(entity);
        entity.addDefaultProperties();
        return entity;
    },
    
    getType: function() {
        return this.type;
    },
    
    getDefinition: function() {
        return EntityManagers._definitions.entityDefinitions[this.getType()];
    },
    
    getActiveExtensions: function() {
        var activeExtensions = [];
        
        var definition = this.getDefinition();
        for(var extensionPoint of definition.extensionPoints) {
            switch(extensionPoint.mode) {
            case "ALL":
                for(var extensionDefinition in extensionPoint.extensionDefinitions) {
                    activeExtensions.push(extensionDefinition);
                }
                break;
            case "SELECT_SINGLE":
                var selected = this.prop(extensionPoint.property).getString();
                var extensionDefinition = extensionPoint.extensionDefinitions[selected];
                if(extensionDefinition != null && extensionDefinition != undefined) {
                    activeExtensions.push(extensionDefinition);
                }
                break;
            }
        }
        
        return activeExtensions;
    },
    
    getPropertyDefinition: function(name) {
        for(var propertyDefinition of this.getDefinition().properties) {
            if(propertyDefinition.name == name) return propertyDefinition;
        }
        for(var extDef of this.getActiveExtensions()) {
            for(var propertyDefinition of extDef.properties) {
                if(propertyDefinition.name == name) return propertyDefinition;
            }
        }
        return null;
    },
    
    addDefaultProperties: function() {
        var def = this.getDefinition();
        
        this.addPropertiesFromDefs(def.properties);
        for(var extDef of this.getActiveExtensions()) {
            this.addPropertiesFromDefs(extDef.properties);
        }
    },
    addPropertiesFromDefs: function(propertyDefinitions) {
        for(var propDef of propertyDefinitions) {
            var property = {
                type: propDef.type,
                viewAccess: propDef.viewAccess,
                editAccess: propDef.editAccess,
                value: propDef.value
            };
            this.addPropertyIfAbsentOrWrong(propDef.name, property);
        }
    },
    addPropertyIfAbsentOrWrong: function(name, property) {
        if(this.properties[name] == null || this.properties[name] == undefined || this.properties[name].type != property.type) {
            this.properties[name] = property;
        }
    },
    
    getPredefinedMacros: function() {
        var macros = {};
        
        this.addPredefinedMacros(macros, this.getDefinition().macros);
        for(var extDef of this.getActiveExtensions()) {
            this.addPredefinedMacros(macros, extDef.macros);
        }
        return macros;
    },
    addPredefinedMacros: function(masterMap, newMap) {
        for(const [key, value] of Object.entries(newMap)) {
            masterMap[key] = value;
        }
    },
    
    prop: function(name) {
        var property = this.properties[name];
        if(property != null && property != undefined) Property.addMethods(property);
        return property;
    },
    
    getViewAccess: function() {
        var as = this.getDefinition().settings.viewAccess;
        switch(as.mode) {
        case "SET":
            return as.value;
        case "PROPERTY":
            return this.prop(as.property).getAccessValue();
        case "PROPERTY_TOGGLE":
            return this.prop(as.property).getBoolean() ? Access.EVERYONE : Access.CONTROLLING_PLAYER;
        }
        console.log("WARNING: Entity Access Mode not implemented: "+as.mode);
        return Access.SYSTEM;
    },
    
    getEditAccess: function() {
        var as = this.getDefinition().settings.editAccess;
        switch(as.mode) {
        case "SET":
            return as.value;
        case "PROPERTY":
            return this.prop(as.property).getAccessValue();
        case "PROPERTY_TOGGLE":
            return this.prop(as.property).getBoolean() ? Access.EVERYONE : Access.CONTROLLING_PLAYER;
        }
        console.log("WARNING: Entity Access Mode not implemented: "+as.mode);
        return Access.SYSTEM;
    },
    
    getAccessLevel: function(profile) {
        var accessLevel = Access.EVERYONE;
        if(profile == null || profile == undefined) accessLevel = Access.SYSTEM;
        else if(profile.role == Role.GM) accessLevel = Access.GM;
        else if(this.getControllingPlayers().includes(profile.id)) accessLevel = Access.CONTROLLING_PLAYER;
        
        var als = this.getDefinition().settings.accessLevel;
        switch(als.mode) {
        case "DEFAULT":
            return accessLevel;
        case "CURRENT_MAP_ID_MATCH":
            return (accessLevel == Access.EVERYONE && profile.currentMap == this.id) ? Access.CONTROLLING_PLAYER : accessLevel;
        case "REFERENCED_ENTITY_PROPERTY_TOGGLE":
            if(!Access.matches(Access.GM, accessLevel)) {
                var entity = EntityManagers.get(als.referenceType).find(this.prop(als.referenceProperty).getLong());
                if(entity == null || entity == undefined || !entity.prop(als.property).getBoolean()) return Access.EVERYONE;
            }
            return accessLevel;
        }
    },
    
    canView: function(profile) {
        return this.canViewWithAccess(this.getAccessLevel(profile));
    },
    
    canEdit: function(profile) {
        return this.canEditWithAccess(this.getAccessLevel(profile));
    },
    
    canViewWithAccess: function(accessLevel) {
        return Access.matches(this.getViewAccess(), accessLevel);
    },
    
    canEditWithAccess: function(accessLevel) {
        return Access.matches(this.getEditAccess(), accessLevel);
    },
    
    //...
    
    getControllingPlayers: function() {
        var cdef = this.getDefinition().settings.control;
        switch(cdef.mode) {
        case "NONE":
        default:
            return [];
        case "PROPERTY":
            var property = this.prop(cdef.property);
            if(property == null || property == undefined) return [];
            switch(property.getType()) {
            case Type.LONG:
                return [property.getLong()];
            case Type.LONG_LIST:
                return property.getLongList();
            default:
                return [];
            }
        }
    },
    
    clone: function() {
        var c = {
            id: this.id,
            type: this.getType(),
            properties: {}
        };
        Entity.addMethods(c);
        
        for(const [key, value] of Object.entries(this.properties)) {
            var property = this.prop(key);
            c.properties[key] = {
                type: property.type,
                value: property.getInternal(),
                viewAccess: property.getViewAccess(),
                editAccess: property.getEditAccess()
            };
        }
        
        return c;
    }
};

Property = {
    addMethods: function(property) {
        //TODO: add property methods?
        property.getType = Property.getType;
        
        property.getViewAccess = Property.getViewAccess;
        property.setViewAccess = Property.setViewAccess;
        property.getEditAccess = Property.getEditAccess;
        property.setEditAccess = Property.setEditAccess;
        
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
        property.getLongList = Property.getLongList;
        property.setLongList = Property.setLongList;
        property.getStringMap = Property.getStringMap;
        property.setStringMap = Property.setStringMap;
        property.getLayer = Property.getLayer;
        property.setLayer = Property.setLayer;
        property.getLight = Property.getLight;
        property.setLight = Property.setLight;
        property.getEffect = Property.getEffect;
        property.setEffect = Property.setEffect;
        property.getColor = Property.getColor;
        property.setColor = Property.setColor;
        property.getAccessValue = Property.getAccessValue;
        property.setAccessValue = Property.setAccessValue;
    },
    
    getType: function() {
        return this.type;
    },
    
    getViewAccess: function() {
        return this.viewAccess;
    },
    setViewAccess: function(access) {
        this.viewAccess = access;
    },
    
    getEditAccess: function() {
        return this.editAccess;
    },
    setEditAccess: function(access) {
        this.editAccess = access;
    },
    
    canView: function(accessLevel) {
        return Access.matches(this.getViewAccess(), accessLevel);
    },
    
    canEdit: function(accessLevel) {
        return Access.matches(this.getEditAccess(), accessLevel);
    },
    
    checkType: function(type) {
        if(this.type != type) {
            throw "Property is of wrong type, required "+type+" but is "+this.type
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
        return Number(this.getInternal());
    },
    setLong: function(value) {
        this.checkType(Type.LONG);
        this.setInternal(String(Math.trunc(value)));
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
    getLongList: function() {
        this.checkType(Type.LONG_LIST);
        if(this.getInternal() == null || this.getInternal() == undefined || this.getInternal() == "") return [];
        return this.getInternal().split(";").map(s => Number(s));
    },
    setLongList: function(value) {
        this.checkType(Type.LONG_LIST);
        this.setInternal(value.join(";")); //TODO: cast/round to long?
    },
    getStringMap: function() {
        this.checkType(Type.STRING_MAP);
        if(this.getInternal() == null || this.getInternal() == undefined || this.getInternal() == "") return {};
        
        var map = {};
        var split = this.getInternal().split("§");
        for(var i=0; i<split.length-1; i+=2) {
            map[split[i]] = split[i+1];
        }
        return map;
    },
    setStringMap: function(value) {
        this.checkType(Type.STRING_MAP);
        
        var string = "";
        for(const [key, value] of Object.entries(value)) {
            string = string + key.replace("§", "") + "§" + value.replace("§", "") + "§";
        }
        this.setInternal(string);
    },
    getLayer: function() {
        this.checkType(Type.LAYER);
        return this.getInternal();
    },
    setLayer: function(value) {
        this.checkType(Type.LAYER);
        this.setInternal(value);
    },
    getLight: function() {
        this.checkType(Type.LIGHT);
        return this.getInternal();
    },
    setLight: function(value) {
        this.checkType(Type.LIGHT);
        this.setInternal(value);
    },
    getEffect: function() {
        this.checkType(Type.EFFECT);
        return this.getInternal();
    },
    setEffect: function(value) {
        this.checkType(Type.EFFECT);
        this.setInternal(value);
    },
    getColor: function() {
        this.checkType(Type.COLOR);
        return "#" + (Number(this.getInternal()) & 0x00FFFFFF).toString(16).padStart(6, '0');
    },
    setColor: function(color) {
        this.checkType(Type.COLOR);
        this.setInternal(parseInt(color.substring(1), 16));
    },
    getAccessValue: function() {
        this.checkType(Type.ACCESS);
        return this.getInternal();
    },
    setAccessValue: function(value) {
        this.checkType(Type.ACCESS);
        this.setInternal(value);
    }
};

//TODO: listeners (both for the reference itself, and listening for entityChanged to update mouseOffsets)
EntityReference = {
    create: function(entity) {
        var reference = {
            id: entity.id,
            type: entity.getType(),
            wrappedProperties: {},
            mouseOffsetX: 0,
            mouseOffsetY: 0
        };
        // entities with id 0 are not in manager -> store in here
        if(entity.id == 0) {
            reference.entity = entity;
        }
        
        Entity.addMethods(reference);
        
        reference.prop = EntityReference.prop;
        reference.getViewAccess = EntityReference.getViewAccess;
        reference.getEditAccess = EntityReference.getEditAccess;
        reference.getBackingEntity = EntityReference.getBackingEntity;
        reference.performUpdate = EntityReference.performUpdate;
        reference.getModifiedEntity = EntityReference.getModifiedEntity;
        reference.isValid = EntityReference.isValid;
        
        return reference;
    },
    
    prop: function(name) {
        if(this.wrappedProperties[name] == null || this.wrappedProperties[name] == undefined) {
            var backingProperty = this.getBackingEntity().prop(name);
            if(backingProperty != null && backingProperty != undefined) {
                this.wrappedProperties[name] = WrappedProperty.create(this, name, backingProperty);
            }
        }
        
        return this.wrappedProperties[name];
    },
    
    getViewAccess: function() {
        var entity = this.getBackingEntity();
        if(entity == null || entity == undefined) return Access.SYSTEM;
        
        return entity.getViewAccess();
    },
    
    getEditAccess: function() {
        var entity = this.getBackingEntity();
        if(entity == null || entity == undefined) return Access.SYSTEM;
        
        return entity.getEditAccess();
    },
    
    getBackingEntity: function() {
        if(this.id == 0) {
            return this.entity;
        } else {
            return EntityManagers.get(this.type).find(this.id);
        }
    },
    
    performUpdate: function() {
        if(this.getBackingEntity() == null || this.getBackingEntity() == undefined) return;
        
        // find all changed properties
        var changedProperties = {};
        for(const [key, value] of Object.entries(this.wrappedProperties)) {
            if(value.isChanged()) {
                changedProperties[key] = value.getChanged();
            }
        }
        
		// send update properties (and clear changes)
        this.wrappedProperties = {};
        if(!_.isEmpty(changedProperties)) {
            EntityManagers.get(this.type).updateProperties(this.id, changedProperties);
        }
    },
    
    getModifiedEntity: function() {
        if(this.getBackingEntity() == null || this.getBackingEntity() == undefined) return null;
        
        var modified = this.getBackingEntity().clone();
        for(const [key, value] of Object.entries(this.wrappedProperties)) {
            if(value.isChanged()) {
                modified.properties[key] = value.getChanged();
            }
        }
        return modified;
    },
    
    isValid: function() {
        var backingEntity = this.getBackingEntity();
        return backingEntity != null && backingEntity != undefined;
    }
};
WrappedProperty = {
    create: function(reference, name, property) {
        var wrapped = {
            type: property.type,
            name: name,
            reference: reference,
            
            changedValue: null,
            changedViewAccess: null,
            changedEditAccess: null
        };
        
        Property.addMethods(wrapped);
        
        wrapped.getViewAccess = WrappedProperty.getViewAccess;
        wrapped.setViewAccess = WrappedProperty.setViewAccess;
        wrapped.getEditAccess = WrappedProperty.getEditAccess;
        wrapped.setEditAccess = WrappedProperty.setEditAccess;
        
        wrapped.getInternal = WrappedProperty.getInternal;
        wrapped.setInternal = WrappedProperty.setInternal;
        
        wrapped.isChanged = WrappedProperty.isChanged;
        wrapped.getChanged = WrappedProperty.getChanged;
        
        wrapped.getBackingProperty = WrappedProperty.getBackingProperty;
        
        return wrapped;
    },
    
    getViewAccess: function() {
        if(this.changedViewAccess != null) {
            return this.changedViewAccess;
        }
        return this.getBackingProperty().getViewAccess();
    },
    setViewAccess: function(access) {
        if(access == null || access == this.getBackingProperty().getViewAccess()) {
            this.changedViewAccess = null;
        } else {
            this.changedViewAccess = access;
        }
    },
    
    getEditAccess: function() {
        if(this.changedEditAccess != null) {
            return this.changedEditAccess;
        }
        return this.getBackingProperty().getEditAccess();
    },
    setEditAccess: function(access) {
        if(access == null || access == this.getBackingProperty().getEditAccess()) {
            this.changedEditAccess = null;
        } else {
            this.changedEditAccess = access;
        }
    },
    
    getInternal: function() {
        if(this.changedValue != null) {
            return this.changedValue;
        } else {
            return this.getBackingProperty().getInternal();
        }
    },
    setInternal: function(value) {
        var backingValue = this.getBackingProperty().getInternal();
        if(value == null || value == backingValue) {
            this.changedValue = null;
        } else {
            this.changedValue = value;
        }
    },
    
    isChanged: function() {
        return this.changedValue != null;
    },
    getChanged: function() {
        var changed = {
            type: this.type,
            value: this.getInternal(),
            viewAccess: this.getViewAccess(),
            editAccess: this.getEditAccess()
        };
        Property.addMethods(changed);
        return changed;
    },
    
    getBackingProperty: function() {
        return this.reference.getBackingEntity().prop(this.name);
    }
};

EntityClipboard = {
    _typedClipboard: new Map(),
    
    validateType: function(entityType) {
        if(!EntityClipboard._typedClipboard.has(entityType)) {
            EntityClipboard._typedClipboard.set(entityType, []);
        }
    },
    
    setEntities: function(entityType, references) {
        EntityClipboard.validateType(entityType);
        
        EntityClipboard._typedClipboard.set(entityType, []);
        for(var reference of references) {
			// copy/clone underlying entity (and reset id)
            var entity = reference.getModifiedEntity();
            entity.id = 0;
            
			// copy EntityReference with required values
            var newReference = EntityReference.create(entity);
            newReference.mouseOffsetX = reference.mouseOffsetX;
            newReference.mouseOffsetY = reference.mouseOffsetY;
            
            EntityClipboard._typedClipboard.get(entityType).push(newReference);
        }
    },
    
    getEntities: function(entityType) {
        EntityClipboard.validateType(entityType);
        
        return EntityClipboard._typedClipboard.get(entityType);
    }
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
        if(entity == null || entity == undefined) return;
        var msg = {
            msg: "AddEntity",
            type: entity.getType(),
            entity: entity
        };
        MessageService.send(msg);
    }
    
    remove(id) {
        var msg = {
            msg: "RemoveEntity",
            type: this.type,
            id: id
        };
        MessageService.send(msg);
    }
    
    updateProperties(id, map) {
        var msg = {
            msg: "UpdateEntityProperties",
            type: this.type,
            id: id,
            properties: map
        };
        MessageService.send(msg);
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