import { VariableParser } from './variable-parser.js';
import { TokenListVariable } from '../token-list-variable.js';
import { EntityFinderList } from '../../finder/entity-finder-list.js';

export class VariableParserTokenList extends VariableParser {
    constructor() {
        super();
    }

    parse(context, fullName, name) {
        if(!context.getEntityFinder('token')) throw new Error(`Internal Error: No EntityFinder for token present`);

        return new TokenListVariable(fullName, false, context.getEntityFinder('token'), new EntityFinderList(name));
    }
}
