import { Access } from '../../common/constants.js';
import { Entity } from '../../common/entity/entity.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { WrappedProperty } from './wrapped-property.js';

export class EntityReference extends Entity {
    backingEntity;
    wrappedProperties = {};

    mouseOffsetX = 0;
    mouseOffsetY = 0;

    listeners = [];

    constructor(entity) {
        super(entity.getType(), entity.getID());

        this.backingEntity = entity;
    }

    getType() {
        return this.backingEntity.getType();
    }

    addDefaultProperties() {
    }
    updatePropertyReferences() {
    }

    prop(name) {
        if(!this.wrappedProperties[name]) {
            const backingProperty = this.backingEntity.prop(name);
            if(backingProperty) this.wrappedProperties[name] = new WrappedProperty(this, backingProperty);
        }

        return this.wrappedProperties[name];
    }

    getProperties() {
        // make sure all properties are wrapped
        for(const propertyName in this.backingEntity.getProperties()) {
            this.prop(propertyName);
        }

        return this.wrappedProperties;
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

    addListener(listener) {
        this.listeners.push(listener);
    }

    removeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if(index >= 0) this.listeners.splice(index, 1);
    }

    performUpdate() {
        if(!this.backingEntity) return;

        // find all changed properties
        var changedProperties = {};
        var hasChanged = false;
        for(const [key, value] of Object.entries(this.wrappedProperties)) {
            if(value.isChanged()) {
                changedProperties[key] = value.clone();
                hasChanged = true;
            }
        }
        
		// update properties (and clear changes)
        this.wrappedProperties = {};
        if(hasChanged) {
            EntityManagers.get(this.getType()).updateProperties(this.getID(), changedProperties, Access.EVERYONE);
        }
    }

    getModifiedEntity() {
        const modified = this.getBackingEntity().clone();
        modified.clonePropertiesFrom(this);
        return modified;
    }

    isValid() {
        const backingEntity = this.getBackingEntity();
        return backingEntity != null && backingEntity != undefined;
    }

    //TODO: call these methods by registering listeners on all entity managers
    entityChanged(entity) {
        // update mouse offset
        if(entity.prop('x') && entity.prop('y')) {
            const xdiff = entity.prop('x').getLong() - this.getBackingEntity().prop('x').getLong();
            const ydiff = entity.prop('y').getLong() - this.getBackingEntity().prop('y').getLong();
            this.mouseOffsetX += xdiff;
            this.mouseOffsetY += ydiff;
        }

        // update backingEntity and notify listeners
        this.backingEntity = entity;
        for(const listener of this.listeners) {
            listener.entityChanged(this);
        }
    }

    entityRemoved() {
        for(const listener of this.listeners) {
            listener.entityRemoved(this);
        }
        this.backingEntity = null;
    }
}