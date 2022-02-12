import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class AddEntities extends Message {
    entities;

    constructor(entities) {
        super();
        this.entities = entities;
    }

    getEntities() {
        return this.entities;
    }
}
registerType(AddEntities);
