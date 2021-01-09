import { PropertyVariable } from "./propertyvariable.js";

export class PropertyVariableMap extends PropertyVariable {
    constructor(fullName, propertyName) {
        super(fullName, propertyName);
    }

    getEntity(context) {
        if(!context.map) throw new Error('No map in this context');
        return context.map;
    }
}
