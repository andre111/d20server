import { ID } from './id.js';
import { EntityManagers } from './entity-managers.js';
import { registerType } from '../util/datautil.js';
import { Access, Type, Role } from '../constants.js';
import { getDefinitions } from '../definitions.js';
import { Events } from '../events.js';
import { Common } from '../common.js';

export class Entity {
    type;
    id;
    manager;
    properties = {};

    #updating = false;

    constructor(type, forcedId) {
        this.type = type;
        if (forcedId) {
            this.id = forcedId;
        }

        if (type) {
            this.addDefaultProperties();
        }
    }

    postLoad() {
        // add default properties after load from data (for potentially outdated entities)
        // but only do so on the server - the client only recieves full entities and would only waste time here
        if (Common.isServer()) this.addDefaultProperties();
    }

    onAdd() {
        this.createContainedEntityManagers();
    }

    onRemove() {
        this.removeContainedEntityManagers();
    }

    getID() {
        if (this.id == null || this.id == undefined) this.id = ID.next();
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
        if (this.manager) return this.manager;
        else return this.type;
    }

    getPath() {
        return this.getManager() + '-' + this.getID();
    }

    // DEFINITIONS
    getDefinition() {
        const def = getDefinitions().getEntityDefinition(this.getType());
        if (!def) throw new Error(`Missing Definition for entity type ${this.getType()}`);
        return def;
    }

    getActiveExtensions() {
        var activeExtensions = [];

        const def = this.getDefinition();
        for (const extensionPoint of def.extensionPoints) {
            switch (extensionPoint.mode) {
                case 'ALL':
                    for (const name in extensionPoint.extensionDefinitions) {
                        activeExtensions.push(extensionPoint.extensionDefinitions[name]);
                    }
                    break;
                case 'SELECT_SINGLE':
                    const selected = this.getString(extensionPoint.property);
                    const extensionDefinition = extensionPoint.extensionDefinitions[selected];
                    if (extensionDefinition) {
                        activeExtensions.push(extensionDefinition);
                    }
                    break;
            }
        }

        return activeExtensions;
    }

    getPropertyDefinition(name) {
        if (this.getDefinition().properties[name]) return this.getDefinition().properties[name];
        for (const extDef of this.getActiveExtensions()) {
            if (extDef.properties[name]) return extDef.properties[name];
        }
        return null;
    }

    // PROPERTY FUNCTIONS
    addDefaultProperties() {
        this.addPropertiesFromDefs(this.getDefinition().properties);
        for (const extDef of this.getActiveExtensions()) {
            this.addPropertiesFromDefs(extDef.properties);
        }
    }

    addPropertiesFromDefs(propertyDefinitions) {
        for (const [name, def] of Object.entries(propertyDefinitions)) {
            this.addPropertyIfAbsentOrWrong(name, def.value);
        }
    }

    addPropertyIfAbsentOrWrong(name, value) {
        if (!this.properties[name]) {
            this.properties[name] = value;
        }
    }

    clonePropertiesFrom(other) {
        this.properties = {};
        const otherProperties = other.getProperties();
        for (const name in otherProperties) {
            this.properties[name] = otherProperties[name];
        }
    }

    getContainedEntityManager(containedEntityType) {
        return EntityManagers.get(this.getContainedEntityManagerName(containedEntityType));
    }

    getContainedEntityManagerName(containedEntityType) {
        if (!this.getContainedEntityTypes().includes(containedEntityType)) throw new Error('Tried to access undefined contained entity manager for ' + containedEntityType + ' in ' + this.getType());

        return this.getType() + '/' + this.getID() + '-' + containedEntityType;
    }

    getContainedEntityTypes() {
        //TODO: this should probably be cached in definition
        var types = [];
        for (const containedEntityType of this.getDefinition().settings.containedEntities) {
            types.push(containedEntityType);
        }
        for (const extDef of this.getActiveExtensions()) {
            for (const containedEntityType of extDef.settings.containedEntities) {
                types.push(containedEntityType);
            }
        }
        return types;
    }

    createContainedEntityManagers() {
        for (const containedEntityType of this.getContainedEntityTypes()) {
            const manager = EntityManagers.getOrCreate(this.getContainedEntityManagerName(containedEntityType), containedEntityType);
            manager.parentEntity = this;
        }
    }

    removeContainedEntityManagers() {
        for (const containedEntityType of this.getContainedEntityTypes()) {
            EntityManagers.delete(this.getContainedEntityManagerName(containedEntityType));
        }
    }

    getProperties() {
        return this.properties;
    }

    onPropertyChange(name) {
        if (!this.#updating) {
            this.#updating = true;
            this.addDefaultProperties();

            const event = Events.trigger('propertyChange', { entity: this, name: name, changedProperties: {} }, false);
            this.#updating = false;

            return event.data.changedProperties;
        }
        return {};
    }

    getPredefinedMacros() {
        const macros = {};

        this.addPredefinedMacros(macros, this.getDefinition().macros);
        for (const extDef of this.getActiveExtensions()) {
            this.addPredefinedMacros(macros, extDef.macros);
        }
        return macros;
    }
    addPredefinedMacros(masterMap, newMap) {
        for (const name in newMap) {
            masterMap[name] = newMap[name];
        }
    }

    // ---------------------- PROPERTIES
    has(name) {
        // old check based on value existance, causes issues because type and access cannot be determined for undefined properties
        //return this.properties.hasOwnProperty(name);
        // new check based on definitions
        return this.getPropertyDefinition(name) != null;
    }

    getPropertyType(name) {
        return this.getPropertyDefinition(name).type;
    }

    getPropertyViewAccess(name) {
        return this.getPropertyDefinition(name).viewAccess;
    }

    getPropertyEditAccess(name) {
        return this.getPropertyDefinition(name).editAccess;
    }

    canViewProperty(name, accessLevel) {
        return this.has(name) && Access.matches(this.getPropertyViewAccess(name), accessLevel);
    }
    canEditProperty(name, accessLevel) {
        return this.has(name) && Access.matches(this.getPropertyEditAccess(name), accessLevel);
    }

    //TODO: checkValue(value) (called hasValidValue in old code)
    isValidValue(name, value) {
        //TODO: actual implementation
        return true;
    }

    hasValidValue(name) {
        return this.isValidValue(name, this.properties[name]);
    }

    checkType(name, requiredType) {
        if (this.getPropertyType(name) != requiredType) throw new Error(`Property is of wrong type, required ${requiredType} but is ${this.getPropertyType(name)}`);
    }

    // --
    getInternal(name) {
        return this.properties[name];
    }
    setInternal(name, value) {
        if (this.properties[name] === value) return;

        this.properties[name] = value;
        this.onPropertyChange(name);
    }

    getString(name) {
        this.checkType(name, Type.STRING);
        return this.getInternal(name);
    }
    setString(name, value) {
        this.checkType(name, Type.STRING);
        this.setInternal(name, value);
    }

    getLong(name) {
        this.checkType(name, Type.LONG);
        return Number(this.getInternal(name));
    }
    setLong(name, value) {
        this.checkType(name, Type.LONG);
        this.setInternal(name, String(Math.trunc(value)));
    }

    getBoolean(name) {
        this.checkType(name, Type.BOOLEAN);
        return this.getInternal(name) == 'true';
    }
    setBoolean(name, value) {
        this.checkType(name, Type.BOOLEAN);
        this.setInternal(name, String(value));
    }

    getDouble(name) {
        this.checkType(name, Type.DOUBLE);
        return Number(this.getInternal(name));
    }
    setDouble(name, value) {
        this.checkType(name, Type.DOUBLE);
        this.setInternal(name, String(value));
    }

    getLongList(name) {
        this.checkType(name, Type.LONG_LIST);
        const value = this.getInternal(name);
        if (!value || value == '') return [];
        return value.split(';').map(s => Number(s));
    }
    setLongList(name, value) {
        this.checkType(name, Type.LONG_LIST);
        this.setInternal(name, value.join(';')); //TODO: cast/round to long
    }

    getStringMap(name) {
        this.checkType(name, Type.STRING_MAP);
        const value = this.getInternal(name);
        if (!value || value == '') return {};

        var map = {};
        var split = value.split('§');
        for (var i = 0; i < split.length - 1; i += 2) {
            map[split[i]] = split[i + 1];
        }
        return map;
    }
    setStringMap(name, value) {
        this.checkType(name, Type.STRING_MAP);

        var string = '';
        for (const [key, entry] of Object.entries(value)) {
            string = string + key.replace('§', '') + '§' + entry.replace('§', '') + '§';
        }
        this.setInternal(name, string);
    }

    getLayer(name) {
        this.checkType(name, Type.LAYER);
        return this.getInternal(name);
    }
    setLayer(name, value) {
        this.checkType(name, Type.LAYER);
        this.setInternal(name, value);
    }

    getLight(name) {
        this.checkType(name, Type.LIGHT);
        return this.getInternal(name);
    }
    setLight(name, value) {
        this.checkType(name, Type.LIGHT);
        this.setInternal(name, value);
    }

    getEffect(name) {
        this.checkType(name, Type.EFFECT);
        return this.getInternal(name);
    }
    setEffect(name, value) {
        this.checkType(name, Type.EFFECT);
        this.setInternal(name, value);
    }

    getColor(name) {
        this.checkType(name, Type.COLOR);
        return '#' + (Number(this.getInternal(name)) & 0x00FFFFFF).toString(16).padStart(6, '0');
    }
    setColor(name, value) {
        this.checkType(name, Type.COLOR);
        this.setInternal(name, String(parseInt(value.substring(1), 16)));
    }

    getAccessValue(name) {
        this.checkType(name, Type.ACCESS);
        return this.getInternal(name);
    }
    setAccessValue(name, value) {
        this.checkType(name, Type.ACCESS);
        this.setInternal(name, value);
    }

    // ----------------------
    getName() {
        return this.has('name') ? this.getString('name') : '';
    }

    getViewAccess() {
        const as = this.getDefinition().settings.viewAccess;
        switch (as.mode) {
            case 'SET':
                return as.value;
            case 'PROPERTY':
                return this.getAccessValue(as.property);
            case 'PROPERTY_TOGGLE':
                return this.getBoolean(as.property) ? Access.EVERYONE : Access.CONTROLLING_PLAYER;
        }
        console.log(`WARNING: Entity Access Mode not implemented: ${as.mode}`);
        return Access.SYSTEM;
    }

    getEditAccess() {
        const as = this.getDefinition().settings.editAccess;
        switch (as.mode) {
            case 'SET':
                return as.value;
            case 'PROPERTY':
                return this.getAccessValue(as.property);
            case 'PROPERTY_TOGGLE':
                return this.getBoolean(as.property) ? Access.EVERYONE : Access.CONTROLLING_PLAYER;
        }
        console.log(`WARNING: Entity Access Mode not implemented: ${as.mode}`);
        return Access.SYSTEM;
    }

    getAccessLevel(profile) {
        var accessLevel = Access.EVERYONE;
        if (!profile) accessLevel = Access.SYSTEM;
        else if (profile.role == Role.GM) accessLevel = Access.GM;
        else if (this.getControllingPlayers().includes(profile.id)) accessLevel = Access.CONTROLLING_PLAYER;

        //TODO: remove this hacky hardcoding by actually implementing custom listeners for the getControllingPlayers event
        if (this.getType() == 'map') {
            return (accessLevel == Access.EVERYONE && profile.currentMap == this.id) ? Access.CONTROLLING_PLAYER : accessLevel;
        }
        return accessLevel;
    }

    canView(profile) {
        return EntityManagers.get(this.getManager()).canView(profile) && Access.matches(this.getViewAccess(), this.getAccessLevel(profile));
    }

    canEdit(profile) {
        return EntityManagers.get(this.getManager()).canView(profile) && Access.matches(this.getEditAccess(), this.getAccessLevel(profile));
    }

    getControllingPlayers() {
        const event = Events.trigger('getControllingPlayers', { entity: this, controllingPlayers: [] }, false);
        return event.data.controllingPlayers;
    }

    clone() {
        const clone = new Entity(this.getType(), this.getID());
        clone.manager = this.manager;
        clone.clonePropertiesFrom(this);
        return clone;
    }
}
registerType(Entity);
