// @ts-check
import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class ResponseFail extends Message {
    to;
    description;

    constructor(to, description) {
        super();
        this.to = to;
        this.description = description;
    }

    getTo() {
        return this.to;
    }

    getDescription() {
        return this.description;
    }
}
registerType(ResponseFail);
