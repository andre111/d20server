import { EntityFinder } from './entity-finder.js';

export class EntityFinderSelectedToken extends EntityFinder {
    findEntity(context) {
        if(!context.profile) throw new Error('No player profile in this context');
        const token = context.profile.getSelectedToken(true);
        if(!token) throw new Error('No (single) token selected');
        return token;
    }
}
