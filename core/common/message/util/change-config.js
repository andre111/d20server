import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class ChangeConfig extends Message {
    key;
    value;

    constructor(key, value) {
        super();
        this.key = key;
        this.value = value;
    }

    getKey() {
        return this.key;
    }

    getValue() {
        return this.value;
    }
}
registerType(ChangeConfig);
