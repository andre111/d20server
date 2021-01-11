import { VariableParserParent } from './variable-parser-parent.js';
import { EntityFinderActorToken } from '../../finder/entity-finder-actor-token.js';

export class VariableParserParentActorToken extends VariableParserParent {
    constructor() {
        super();
    }

    updateContext(context, name) {
        if(!context.getEntityFinder('token')) throw new Error(`Internal Error: No EntityFinder for token present`);

        context.setEntityFinder('actor', new EntityFinderActorToken(context.getEntityFinder('token')));
    }
}
