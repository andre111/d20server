import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class SelectedEntities extends Message {
    type;
    entites;

    constructor(type, entites) {
        super();
        this.type = type;
        this.entites = entites;
    }

    getType() {
        return this.type;
    }

    getEntities() {
        return this.entites;
    }

    requiresMap() {
        return true;
    }
}
registerType(SelectedEntities);
