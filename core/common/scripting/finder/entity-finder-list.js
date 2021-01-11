import { EntityFinder } from './entity-finder.js';
import { EntityManagers } from '../../entity/entity-managers.js';

export class EntityFinderList extends EntityFinder {
    name;

    constructor(name) {
        super();

        this.name = name;
    }

    findEntity(context) {
        for(const list of EntityManagers.get('token_list').all()) {
            if(list.getName() == this.name) {
                return list;
            }
        }

        throw new Error(`Could not find list ${this.name}`);
    }
}
