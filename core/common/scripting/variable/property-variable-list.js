import { EntityManagers } from "../../entity/entitymanagers.js";
import { PropertyVariable } from "./propertyvariable.js";

export class PropertyVariableList extends PropertyVariable {
    listName;

    constructor(fullName, listName, propertyName) {
        super(fullName, propertyName);

        this.listName = listName;
    }

    getEntity(context) {
        //TODO... implement
    }
}