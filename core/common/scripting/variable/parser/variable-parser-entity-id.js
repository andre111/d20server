import { VariableParser } from './variable-parser.js';
import { EntityIDVariable } from '../entity-id-variable.js';

export class VariableParserEntityID extends VariableParser {
    type;

    constructor(type) {
        super();

        this.type = type;
    }

    parse(context, fullName, name) {
        if(!context.getEntityFinder(this.type)) throw new Error(`Internal Error: No EntityFinder for ${this.type} present`);

        return new EntityIDVariable(fullName, context.getEntityFinder(this.type));
    }
}
