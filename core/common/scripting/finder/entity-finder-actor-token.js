import { EntityManagers } from '../../entity/entitymanagers.js';
import { EntityFinder } from './entityfinder.js'

export class EntityFinderActorToken extends EntityFinder {
    tokenFinder;

    constructor(tokenFinder) {
        super();

        this.tokenFinder = tokenFinder;
    }

    findEntity(context) {
        const actorID = this.tokenFinder.findEntity(context).prop('actorID').getLong();
        const actor = EntityManagers.get('actor').find(actorID);
        if(!actor) throw new Error('Token has no assigne actor');
        return actor;
    }
}
