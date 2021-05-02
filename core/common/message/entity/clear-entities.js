import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class ClearEntities extends Message {
    manager;
    type;

    constructor(manager, type) {
        super();
        this.manager = manager;
        this.type = type;
    }

    getManager() {
        return this.manager;
    }

    getType() {
        return this.type;
    }
}
registerType(ClearEntities);
