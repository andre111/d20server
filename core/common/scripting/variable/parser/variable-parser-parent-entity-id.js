import { VariableParserParent } from './variable-parser-parent.js';
import { EntityFinderID } from '../../finder/entity-finder-id.js';

export class VariableParserParentEntityID extends VariableParserParent {
    type;

    constructor(type) {
        super();
        
        this.type = type;
    }

    getChildParserName(name) {
        const split = name.split('.');
        return split.length>1 ? split[1] : '';
    }

    getChildString(name) {
        const split = name.split('.');
        return split.length>=3 ? split.slice(2).join('.') : '';
    }

    updateContext(context, name) {
        const split = name.split('.');
        const entityID = Number(split[0]);
        if(isNaN(entityID)) throw new Error(`Provided value is not a valid id: ${split[0]}`);

        context.setEntityFinder(this.type, new EntityFinderID(this.type, entityID));
    }
}
