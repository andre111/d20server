import { EntityFinder } from './entity-finder.js';

export class EntityFinderSelf extends EntityFinder {
    findEntity(context) {
        if(!context.self) throw new Error('No "self" entity in this context');
        return context.self;
    }
}
