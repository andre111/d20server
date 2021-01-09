import { Property } from '../../common/entity/property.js';

export class WrappedProperty extends Property {
    reference;

    changedValue;
    changedEditAccess;
    changedViewAccess;

    constructor(reference, property) {
        super(property.getType(), property.getEditAccess(), property.getViewAccess(), property.getInternal());

        this.reference = reference;
        this.setHolder(reference);
        this.setName(property.getName());
    }

    getEditAccess() {
        if(this.changedEditAccess) return this.changedEditAccess;
        return this.getBackingProperty().getEditAccess();
    }

    setEditAccess(editAccess) {
        if(!editAccess || editAccess == this.getBackingProperty().getEditAccess()) {
            this.changedEditAccess = undefined;
        } else {
            this.changedEditAccess = editAccess;
        }
    }

    getViewAccess() {
        if(this.changedViewAccess) return this.changedViewAccess;
        return this.getBackingProperty().getViewAccess();
    }

    setViewAccess(viewAccess) {
        if(!viewAccess || viewAccess == this.getBackingProperty().getViewAccess()) {
            this.changedViewAccess = undefined;
        } else {
            this.changedViewAccess = viewAccess;
        }
    }

    getInternal() {
        if(this.changedValue != undefined && this.changedValue != null) return this.changedValue;
        return this.getBackingProperty().getInternal();
    }

    setInternal(value) {
        if(value == null || value == undefined || value == this.getBackingProperty().getInternal()) {
            this.changedValue = undefined;
        } else {
            this.changedValue = value;
        }
        this.reference.onPropertyChange(this.getName(), this);
    }

    isChanged() {
        return (this.changedValue != null && this.changedValue != undefined) || this.changedEditAccess || this.changedViewAccess;
    }

    getBackingProperty() {
        return this.reference.getBackingEntity().prop(this.getName());
    }
}
