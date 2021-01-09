import { Variable } from "./variable.js";

export class EntityIDVariable extends Variable {
    entityFinder;

    constructor(fullName, entityFinder) {
        super(fullName);

        this.entityFinder = entityFinder;
    }

    set(context, value) {
        throw new Error('Entity id is read only');
    }

    get(context) {
        return this.entityFinder.findEntity(context).getID();
    }
}
