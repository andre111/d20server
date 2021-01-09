import { Variable } from "./variable.js";

export class SelfIDVariable extends Variable {
    constructor(fullName) {
        super(fullName);
    }

    set(context, value) {
        throw new Error('Entity id is read only');
    }

    get(context) {
        if(!context.self) throw new Error('No "self" entity in this context');
        return context.self.getID();
    }
}
