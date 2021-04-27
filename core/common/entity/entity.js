import { ID } from './id.js';
import { EntityManagers } from './entity-managers.js';
import { registerType } from '../util/datautil.js';
import { Property } from './property.js';
import { Access, Type, Role } from '../constants.js';
import { getDefinitions } from '../definitions.js';
import { ParserInstance } from '../scripting/expression/parser.js';
import { Context } from '../scripting/context.js';
import { TokenUtil } from '../util/tokenutil.js';

export class Entity {
    type;
    id;
    manager;
    properties = {};

    _transient_updating = false;

    constructor(type, forcedId) {
        this.type = type;
        if(forcedId) {
            this.id = forcedId;
        }

        if(type) {
            this.addDefaultProperties();
            this.updatePropertyReferences();
        }
    }

    postLoad() {
        this.addDefaultProperties();
        this.updatePropertyReferences();
    }

    onAdd() {
        this.createContainedEntityManagers();
    }

    onRemove() {
        this.removeContainedEntityManagers();
    }

    getID() {
        if(this.id == null || this.id == undefined) this.id = ID.next();
        return this.id;
    }

    resetID() {
        this.id = ID.next();
    }

    transferIDFrom(other) {
        this.id = other.getID();
    }

    getType() {
        return this.type;
    }

    getManager() {
        if(this.manager) return this.manager;
        else return this.type;
    }

    // DEFINITIONS
    getDefinition() {
        const def = getDefinitions().getEntityDefinition(this.getType());
        if(!def) throw new Error(`Missing Definition for entity type ${this.getType()}`);
        return def;
    }

    getActiveExtensions() {
        var activeExtensions = [];

        const def = this.getDefinition();
        for(const extensionPoint of def.extensionPoints) {
            switch(extensionPoint.mode) {
            case 'ALL':
                for(const name in extensionPoint.extensionDefinitions) {
                    activeExtensions.push(extensionPoint.extensionDefinitions[name]);
                }
                break;
            case 'SELECT_SINGLE':
                const selected = this.prop(extensionPoint.property).getString();
                const extensionDefinition = extensionPoint.extensionDefinitions[selected];
                if(extensionDefinition) {
                    activeExtensions.push(extensionDefinition);
                }
                break;
            }
        }

        return activeExtensions;
    }

    getPropertyDefinition(name) {
        //TODO: this is terribly inefficient, move to map based property definitions
        for(const propertyDefinition of this.getDefinition().properties) {
            if(propertyDefinition.name == name) return propertyDefinition;
        }
        for(const extDef of this.getActiveExtensions()) {
            for(const propertyDefinition of extDef.properties) {
                if(propertyDefinition.name == name) return propertyDefinition;
            }
        }
        return null;
    }

    // PROPERTY FUNCTIONS
    addDefaultProperties() {
        this.addPropertiesFromDefs(this.getDefinition().properties);
        for(const extDef of this.getActiveExtensions()) {
            this.addPropertiesFromDefs(extDef.properties);
        }
    }

    addPropertiesFromDefs(propertyDefinitions) {
        for(const propDef of propertyDefinitions) {
            this.addPropertyIfAbsentOrWrong(propDef.name, propDef.type, propDef.value);
        }
    }

    addPropertyIfAbsentOrWrong(name, type, value) {
        if(!this.properties[name] || this.properties[name].getType() != type) {
            const property = new Property(type, value);
            property.setHolder(this);
            property.setName(name);
            this.properties[name] = property;
        }
        return this.properties[name];
    }

    clonePropertiesFrom(other) {
        this.properties = {};
        const otherProperties = other.getProperties();
        for(const name in otherProperties) {
            this.properties[name] = otherProperties[name].clone();
        }
        this.updatePropertyReferences();
    }

    updatePropertyReferences() {
        for(const name in this.properties) {
            const property = this.properties[name];
            property.setHolder(this);
            property.setName(name);
        }
    }

    getContainedEntityManagerName(containedEntityType) {
        return this.getType()+'/'+this.getID()+'-'+containedEntityType;
    }

    createContainedEntityManagers() {
        for(const containedEntityType of this.getDefinition().settings.containedEntities) {
            EntityManagers.getOrCreate(this.getContainedEntityManagerName(containedEntityType), containedEntityType);
        }
    }

    removeContainedEntityManagers() {
        for(const containedEntityType of this.getDefinition().settings.containedEntities) {
            EntityManagers.delete(this.getContainedEntityManagerName(containedEntityType));
        }
    }

    prop(name) {
        return this.properties[name];
    }

    getProperties() {
        return this.properties;
    }

    onPropertyChange(name, property) {
        if(!this._transient_updating) {
            this._transient_updating = true;
            this.addDefaultProperties();

            const changedProperties = {};
            const def = this.getDefinition();
            this.applyUpdateRules(def.updateRules, changedProperties);
            for(const extDef of this.getActiveExtensions()) {
                this.applyUpdateRules(extDef.updateRules, changedProperties);
            }

            this._transient_updating = false;
            return changedProperties;
        }
        return {};
    }

    applyUpdateRules(updateRules, changedProperties) {
        for(const ruleDef of updateRules) {
            const property = this.prop(ruleDef.property);
            if(!property) throw new Error(`Error in UpdateRule: Property ${ruleDef.property} does not exist`);

            try {
                // use cached expression or parse from definition (because parsing is an expensive operation that can lock up the browser for a noticeable time)
                const expression = ruleDef._transient_parsedExpression ? ruleDef._transient_parsedExpression : ParserInstance.parse(ruleDef.expression);
                ruleDef._transient_parsedExpression = expression;

                const result = expression.eval(new Context(null, null, this));
            
                const value = result.getValue();
                switch(property.getType()) {
                case Type.DOUBLE:
                    property.setDouble(value);
                    break;
                case Type.LONG:
                    property.setLong(Math.trunc(value));
                    break;
                case Type.STRING:
                    var stringValue = '?';
                    if(ruleDef.stringMap && ruleDef.stringMap[Math.trunc(value)]) stringValue = ruleDef.stringMap[Math.trunc(value)];
                    property.setString(stringValue);
                    break;
                default:
                    throw new Error(`Error in UpdateRule: Cannot modify property of type ${property.getType()}`);
                }
                changedProperties[ruleDef.property] = property;
            } catch (error) {
                //TODO: how can I report where the old error happended?
                //throw new Error(`Error in UpdateRule: ${error.message}`);
                console.log(`Error in UpdateRule: ${error.message}`);
                throw error;
            }
        }
    }

    getPredefinedMacros() {
        const macros = {};

        this.addPredefinedMacros(macros, this.getDefinition().macros);
        for(const extDef of this.getActiveExtensions()) {
            this.addPredefinedMacros(macros, extDef.macros);
        }
        return macros;
    }
    addPredefinedMacros(masterMap, newMap) {
        for(const name in newMap) {
            masterMap[name] = newMap[name];
        }
    }

    getPropertyViewAccess(name) {
        return this.getPropertyDefinition(name).viewAccess;
    }

    getPropertyEditAccess(name) {
        return this.getPropertyDefinition(name).editAccess;
    }

    // ----------------------
    getName() {
        return this.prop('name') ? this.prop('name').getString() : '';
    }

    getViewAccess() {
        const as = this.getDefinition().settings.viewAccess;
        switch(as.mode) {
        case 'SET':
            return as.value;
        case 'PROPERTY':
            return this.prop(as.property).getAccessValue();
        case 'PROPERTY_TOGGLE':
            return this.prop(as.property).getBoolean() ? Access.EVERYONE : Access.CONTROLLING_PLAYER;
        }
        console.log(`WARNING: Entity Access Mode not implemented: ${as.mode}`);
        return Access.SYSTEM;
    }

    getEditAccess() {
        const as = this.getDefinition().settings.editAccess;
        switch(as.mode) {
        case 'SET':
            return as.value;
        case 'PROPERTY':
            return this.prop(as.property).getAccessValue();
        case 'PROPERTY_TOGGLE':
            return this.prop(as.property).getBoolean() ? Access.EVERYONE : Access.CONTROLLING_PLAYER;
        }
        console.log(`WARNING: Entity Access Mode not implemented: ${as.mode}`);
        return Access.SYSTEM;
    }

    getAccessLevel(profile) {
        var accessLevel = Access.EVERYONE;
        if(!profile) accessLevel = Access.SYSTEM;
        else if(profile.role == Role.GM) accessLevel = Access.GM;
        else if(this.getControllingPlayers().includes(profile.id)) accessLevel = Access.CONTROLLING_PLAYER;
        
        const als = this.getDefinition().settings.accessLevel;
        switch(als.mode) {
        case 'DEFAULT':
            return accessLevel;
        case 'CURRENT_MAP_ID_MATCH':
            return (accessLevel == Access.EVERYONE && profile.currentMap == this.id) ? Access.CONTROLLING_PLAYER : accessLevel;
        case 'REFERENCED_ENTITY_PROPERTY_TOGGLE':
            if(!Access.matches(Access.GM, accessLevel)) {
                const entity = EntityManagers.get(als.referenceType).find(this.prop(als.referenceProperty).getLong());
                if(!entity || !entity.prop(als.property).getBoolean()) return Access.EVERYONE;
            }
            return accessLevel;
        }
    }

    canView(profile) {
        return this.canViewWithAccess(this.getAccessLevel(profile));
    }

    canEdit(profile) {
        return this.canEditWithAccess(this.getAccessLevel(profile));
    }

    canViewWithAccess(accessLevel) {
        return Access.matches(this.getViewAccess(), accessLevel);
    }

    canEditWithAccess(accessLevel) {
        return Access.matches(this.getEditAccess(), accessLevel);
    }

    getControllingPlayers() {
        const cdef = this.getDefinition().settings.control;
        switch(cdef.mode) {
        case 'NONE':
        default:
            return [];
        case 'PROPERTY':
            const property = this.prop(cdef.property);
            if(!property) return [];
            switch(property.getType()) {
            case Type.LONG:
                return [property.getLong()];
            case Type.LONG_LIST:
                return property.getLongList();
            default:
                return [];
            }
        //TODO: remove this wierd stuff, maybe just move away from data driven again and just use code
        case 'TOKEN':
            return TokenUtil.getControllingPlayers(this);
        }
    }

    clone() {
        const clone = new Entity(this.getType(), this.getID());
        clone.clonePropertiesFrom(this);
        return clone;
    }
}
registerType(Entity);
