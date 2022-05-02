// @ts-check
import { Access } from '../constants.js';
import { Entity } from './entity.js';
import { EntityManagers } from './entity-managers.js';
import { deepMerge } from '../util/datautil.js';
import { Events } from '../events.js';

// INTERNAL EVENT LISTENER MANAGERS
const EVENT_LISTENERS = {};
class EventListener {
    #type;
    #modifyListener;
    #removeListener;

    #listeningReferences = [];

    constructor(type) {
        this.#type = type;

        this.#modifyListener = Events.on('modified_' + this.#type, event => this.onModified(event));
        this.#removeListener = Events.on('removed_' + this.#type, event => this.onRemoved(event));
    }

    unregister() {
        Events.remove('modified_' + this.#type, this.#modifyListener);
        Events.remove('removed_' + this.#type, this.#removeListener);
    }

    onModified(event) {
        const id = event.data.entity.getID();
        const manager = event.data.manager.getName();

        for (const reference of this.#listeningReferences) {
            if (id == reference.getBackingEntity().getID() && manager == reference.getBackingEntity().getManager()) reference.entityChanged(event.data.entity);
        }
    }

    onRemoved(event) {
        const id = event.data.entity.getID();
        const manager = event.data.manager.getName();

        for (const reference of this.#listeningReferences) {
            if (id == reference.getBackingEntity().getID() && manager == reference.getBackingEntity().getManager()) reference.entityRemoved();
        }
    }

    addReference(reference) {
        this.#listeningReferences.push(reference);
    }

    removeReference(reference) {
        const index = this.#listeningReferences.indexOf(reference);
        if (index >= 0) this.#listeningReferences.splice(index, 1);
    }

    isEmpty() {
        return this.#listeningReferences.length == 0;
    }
}
function registerListeners(reference) {
    const type = reference.getType();
    if (!EVENT_LISTENERS[type]) EVENT_LISTENERS[type] = new EventListener(type);

    // add reference to listener
    EVENT_LISTENERS[type].addReference(reference);
}
function unregisterListeners(reference) {
    const type = reference.getType();
    if (!EVENT_LISTENERS[type]) return;

    // remove reference from listener
    EVENT_LISTENERS[type].removeReference(reference);

    // unregister and destroy listener if no references remain
    if (EVENT_LISTENERS[type].isEmpty()) {
        EVENT_LISTENERS[type].unregister();
        delete EVENT_LISTENERS[type];
    }
}

// ACTUAL CLASS
export class EntityReference extends Entity {
    backingEntity;
    changedProperties = {};

    mouseOffsetX = 0;
    mouseOffsetY = 0;

    listeners = [];

    constructor(entity) {
        super(entity.getType(), entity.getID());

        this.backingEntity = entity;
    }

    getManager() {
        return this.backingEntity.getManager();
    }

    addDefaultProperties() {
    }

    getProperties() {
        // create new combined property map
        const props = deepMerge(this.backingEntity.getProperties(), this.changedProperties);
        return props;
    }

    has(name) {
        if (!this.backingEntity) return false;
        return super.has(name);
    }

    getInternal(name) {
        if (this.changedProperties[name]) return this.changedProperties[name];
        return this.backingEntity.getInternal(name);
    }
    setInternal(name, value) {
        if (value === this.backingEntity.getInternal(name)) delete this.changedProperties[name];
        else this.changedProperties[name] = value;
        this.onPropertyChange(name);
    }

    getViewAccess() {
        if (!this.backingEntity) return Access.SYSTEM;
        return this.backingEntity.getViewAccess();
    }

    getEditAccess() {
        if (!this.backingEntity) return Access.SYSTEM;
        return this.backingEntity.getEditAccess();
    }

    getAccessLevel(profile) {
        if (!this.backingEntity) return Access.EVERYONE;
        return this.backingEntity.getAccessLevel(profile);
    }

    getBackingEntity() {
        return this.backingEntity;
    }

    getMouseOffsetX() {
        return this.mouseOffsetX;
    }

    setMouseOffsetX(mouseOffsetX) {
        this.mouseOffsetX = mouseOffsetX;
    }

    getMouseOffsetY() {
        return this.mouseOffsetY;
    }

    setMouseOffsetY(mouseOffsetY) {
        this.mouseOffsetY = mouseOffsetY;
    }

    //NOTE: When registering a listener we ALWAYS need to unregister the listeners again or the EntityReference will be leaked
    addListener(listener) {
        // register with events manager
        if (this.listeners.length == 0) {
            registerListeners(this);
        }

        this.listeners.push(listener);
    }

    removeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if (index >= 0) this.listeners.splice(index, 1);

        // unregister with events manager
        if (this.listeners.length == 0) {
            unregisterListeners(this);
        }
    }

    performUpdate(keepLocalChanges = false) {
        if (!this.backingEntity) return;

        // update properties (and clear changes)
        if (Object.keys(this.changedProperties).length > 0) {
            EntityManagers.get(this.getManager()).updateProperties(this.getID(), this.changedProperties, Access.SYSTEM);
            if (!keepLocalChanges) this.changedProperties = {};
        }
    }

    getModifiedEntity() {
        const modified = this.backingEntity.clone();
        modified.clonePropertiesFrom(this);
        return modified;
    }

    getModifiedProperties() {
        return this.changedProperties;
    }

    performRemove() {
        if (!this.backingEntity) return;

        EntityManagers.get(this.getManager()).remove(this.getID());
    }

    isValid() {
        const backingEntity = this.backingEntity;
        return backingEntity != null && backingEntity != undefined;
    }

    entityChanged(entity) {
        // update mouse offset
        if (entity.has('x') && entity.has('y')) {
            const xdiff = entity.getLong('x') - this.backingEntity.getLong('x');
            const ydiff = entity.getLong('y') - this.backingEntity.getLong('y');
            this.mouseOffsetX += xdiff;
            this.mouseOffsetY += ydiff;
        }

        // update backingEntity and notify listeners
        this.backingEntity = entity;
        for (const listener of this.listeners) {
            if (listener.entityChanged) listener.entityChanged(this);
        }
    }

    entityRemoved() {
        for (const listener of this.listeners) {
            if (listener.entityRemoved) listener.entityRemoved(this);
        }
        this.backingEntity = null;
    }
}
