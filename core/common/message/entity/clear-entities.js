import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class ClearEntities extends Message {
    manager;

    constructor(manager) {
        super();
        this.manager = manager;
    }

    getManager() {
        return this.manager;
    }
}
registerType(ClearEntities);
