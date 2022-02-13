import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class AddEntities extends Message {
    manager;
    entities;

    constructor(manager, entities) {
        super();
        this.manager = manager;
        this.entities = entities;
    }

    getManager() {
        return this.manager;
    }

    getEntities() {
        return this.entities;
    }
}
registerType(AddEntities);
