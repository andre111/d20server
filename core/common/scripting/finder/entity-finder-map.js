import { EntityFinder } from './entity-finder.js';

export class EntityFinderMap extends EntityFinder {
    findEntity(context) {
        if(!context.map) throw new Error('No map in this context');
        return context.map;
    }
}
