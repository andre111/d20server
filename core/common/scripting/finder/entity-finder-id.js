import { EntityManagers } from '../../entity/entity-managers.js';
import { EntityFinder } from './entity-finder.js';

export class EntityFinderID extends EntityFinder {
    type;
    id;

    constructor(type, id) {
        super();

        this.type = type;
        this.id = id;
    }

    findEntity(context) {
        const entity = EntityManagers.get(this.type).find(this.id);
        if(!entity) throw new Error(`${this.type} with id ${this.id} not found`);
        return entity;
    }
}
