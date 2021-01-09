import { PropertyVariable } from "./propertyvariable.js";

export class PropertyVariableSelf extends PropertyVariable {
    constructor(fullName, propertyName) {
        super(fullName, propertyName);
    }

    getEntity(context) {
        if(!context.self) throw new Error('No "self" entity in this context');
        return context.self;
    }
}
