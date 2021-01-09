import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class ResponseOk extends Message {
    to;

    constructor(to) {
        super();
        this.to = to;
    }

    getTo() {
        return this.to;
    }
}
registerType(ResponseOk);
