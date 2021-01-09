import { PropertyVariable } from "./propertyvariable.js";

export class PropertyVariableEntity extends PropertyVariable {
    entityFinder;

    constructor(fullName, propertyName, entityFinder) {
        super(fullName, propertyName);

        this.entityFinder = entityFinder;
    }

    getEntity(context) {
        return this.entityFinder.findEntity(context);
    }
}
