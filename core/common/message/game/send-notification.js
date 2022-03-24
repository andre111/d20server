// @ts-check
import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class SendNotification extends Message {
    content;
    time;

    constructor(content, time) {
        super();

        this.content = content;
        this.time = time;
    }

    getContent() {
        return this.content;
    }

    getTime() {
        return this.time;
    }
}
registerType(SendNotification);
