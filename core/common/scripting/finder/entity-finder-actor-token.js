import { TokenUtil } from '../../util/tokenutil.js';
import { EntityFinder } from './entity-finder.js'

export class EntityFinderActorToken extends EntityFinder {
    #tokenFinder;

    constructor(tokenFinder) {
        super();

        this.#tokenFinder = tokenFinder;
    }

    findEntity(context) {
        const actor = TokenUtil.getActor(this.#tokenFinder.findEntity(context));
        if(!actor) throw new Error('Token has no assigned actor');
        return actor;
    }
}
