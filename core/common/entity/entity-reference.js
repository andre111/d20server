import { Access } from '../constants.js';
import { Entity } from './entity.js';
import { EntityManagers } from './entity-managers.js';
import { deepMerge } from '../util/datautil.js';

export class EntityReference extends Entity {
    backingEntity;
    changedProperties = {};

    mouseOffsetX = 0;
    mouseOffsetY = 0;

    listeners = [];
    entityListener;
    removalListener;

    constructor(entity) {
        super(entity.getType(), entity.getID());

        this.backingEntity = entity;

        // prepare listeners (will only be registered when a listener is registered on this reference)
        this.entityListener = (e) => {
            if(e.getID() == this.getBackingEntity().getID()) this.entityChanged(e);
        };
        this.removalListener = (id, e) => {
            if(id == this.getBackingEntity().getID()) this.entityRemoved();
        }
    }

    getManager() {
        return this.backingEntity.getManager();
    }

    addDefaultProperties() {
    }

    getProperties() {
        // create new combined property map
        const props = deepMerge(this.getBackingEntity().getProperties(), this.changedProperties);
        return props;
    }

    has(name) {
        if(!this.backingEntity) return false;
        return this.getBackingEntity().has(name);
    }

    getInternal(name) {
        if(this.changedProperties[name]) return this.changedProperties[name];
        return this.getBackingEntity().getInternal(name);
    }
    setInternal(name, value) {
        if(value === this.getBackingEntity().getInternal(name)) delete this.changedProperties[name];
        else this.changedProperties[name] = value;
        this.onPropertyChange(name);
    }

    getViewAccess() {
        if(!this.backingEntity) return Access.SYSTEM;
        return this.backingEntity.getViewAccess();
    }

    getEditAccess() {
        if(!this.backingEntity) return Access.SYSTEM;
        return this.backingEntity.getEditAccess();
    }

    getAccessLevel(profile) {
        if(!this.backingEntity) return Access.EVERYONE;
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
        // register with entitymanager
        if(this.listeners.length == 0) {
            EntityManagers.get(this.getManager()).addEntityListener(this.entityListener);
            EntityManagers.get(this.getManager()).addRemovalListener(this.removalListener);
        }

        this.listeners.push(listener);
    }

    removeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if(index >= 0) this.listeners.splice(index, 1);

        // unregister with entitymanager
        if(this.listeners.length == 0) {
            EntityManagers.get(this.getManager()).removeEntityListener(this.entityListener);
            EntityManagers.get(this.getManager()).removeRemovalListener(this.removalListener);
        }
    }

    performUpdate() {
        if(!this.backingEntity) return;
        
		// update properties (and clear changes)
        if(Object.keys(this.changedProperties).length > 0) {
            EntityManagers.get(this.getManager()).updateProperties(this.getID(), this.changedProperties, Access.SYSTEM);
            this.changedProperties = {};
        }
    }

    getModifiedEntity() {
        const modified = this.getBackingEntity().clone();
        modified.clonePropertiesFrom(this);
        return modified;
    }

    getModifiedProperties() {
        return this.changedProperties;
    }

    isValid() {
        const backingEntity = this.getBackingEntity();
        return backingEntity != null && backingEntity != undefined;
    }

    entityChanged(entity) {
        // update mouse offset
        if(entity.has('x') && entity.has('y')) {
            const xdiff = entity.getLong('x') - this.getBackingEntity().getLong('x');
            const ydiff = entity.getLong('y') - this.getBackingEntity().getLong('y');
            this.mouseOffsetX += xdiff;
            this.mouseOffsetY += ydiff;
        }

        // update backingEntity and notify listeners
        this.backingEntity = entity;
        for(const listener of this.listeners) {
            if(listener.entityChanged) listener.entityChanged(this);
        }
    }

    entityRemoved() {
        for(const listener of this.listeners) {
            if(listener.entityRemoved) listener.entityRemoved(this);
        }
        this.backingEntity = null;
    }
}
