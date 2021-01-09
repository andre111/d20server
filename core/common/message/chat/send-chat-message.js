import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class SendChatMessage extends Message {
    message;

    constructor(message) {
        super();
        this.message = message;
    }

    getMessage() {
        return this.message;
    }
}
registerType(SendChatMessage);
