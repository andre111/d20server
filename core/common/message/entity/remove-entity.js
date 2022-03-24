// @ts-check
import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class RemoveEntity extends Message {
    manager;
    id;

    constructor(manager, id) {
        super();
        this.manager = manager;
        this.id = id;
    }

    getManager() {
        return this.manager;
    }

    getID() {
        return this.id;
    }
}
registerType(RemoveEntity);
