
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
