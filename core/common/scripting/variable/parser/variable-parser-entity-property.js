import { VariableParser } from './variable-parser.js';
import { EntityPropertyVariable } from '../entity-property-variable.js';

export class VariableParserEntityProperty extends VariableParser {
    type;

    constructor(type) {
        super();

        this.type = type;
    }

    parse(context, fullName, name) {
        if(!context.getEntityFinder(this.type)) throw new Error(`Internal Error: No EntityFinder for ${this.type} present`);

        return new EntityPropertyVariable(fullName, name, context.getEntityFinder(this.type));
    }
}
