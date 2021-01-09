import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class EntityLoading extends Message {
    count;

    constructor(count) {
        super();
        this.count = count;
    }

    getCount() {
        return this.count;
    }
}
registerType(EntityLoading);
