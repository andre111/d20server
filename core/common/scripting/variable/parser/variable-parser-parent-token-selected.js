import { VariableParserParent } from './variable-parser-parent.js';
import { EntityFinderSelectedToken } from '../../finder/entity-finder-selected-token.js';

export class VariableParserParentTokenSelected extends VariableParserParent {
    static finder = new EntityFinderSelectedToken();

    constructor() {
        super();
    }

    updateContext(context, name) {
        context.setEntityFinder('token', VariableParserParentTokenSelected.finder);
    }
}