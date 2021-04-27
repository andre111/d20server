import { Property } from './property.js';

export class WrappedProperty extends Property {
    reference;

    changedValue;

    constructor(reference, property) {
        super(property.getType(), property.getInternal());

        this.reference = reference;
        this.setHolder(reference);
        this.setName(property.getName());
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
        return (this.changedValue != null && this.changedValue != undefined);
    }

    getBackingProperty() {
        return this.reference.getBackingEntity().prop(this.getName());
    }
}
