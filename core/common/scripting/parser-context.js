import { EntityFinder } from './finder/entity-finder.js';

export class ParserContext {
    entityFinders = {};

    getEntityFinder(type) {
        return this.entityFinders[type];
    }

    setEntityFinder(type, entityFinder) {
        if(!(entityFinder instanceof EntityFinder)) throw new Error('Can only use instances of EntityFinder');
        this.entityFinders[type] = entityFinder;
    }
}
