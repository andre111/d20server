import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class RemoveEntity extends Message {
    type;
    id;

    constructor(type, id) {
        super();
        this.type = type;
        this.id = id;
    }

    getType() {
        return this.type;
    }

    getID() {
        return this.id;
    }
}
registerType(RemoveEntity);
