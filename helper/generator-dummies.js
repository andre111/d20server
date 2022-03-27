
import { EntityManager } from '../core/common/entity/entity-managers.js';
import { IDProvider } from '../core/common/entity/id.js';

export class GeneratorIDProvider extends IDProvider {
    #nextID = 1;

    constructor() {
        super();

        this.#nextID = 1;
    }

    next() {
        const id = this.#nextID;
        this.#nextID++;
        return id;
    }
}

export class GeneratorEntityManager extends EntityManager {
    constructor(name, type) {
        super(name, type);
    }

    find(id) { return null; }
    has(id) { return false; }
    all() { return []; }
    map() { return {} }

    add(entity) { }
    remove(id) { }
    updateProperties(id, map, accessLevel) { }

    canView(profile) { return true; }
}
