import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class ClearEntities extends Message {
    type;

    constructor(type) {
        super();
        this.type = type;
    }

    getType() {
        return this.type;
    }
}
registerType(ClearEntities);
