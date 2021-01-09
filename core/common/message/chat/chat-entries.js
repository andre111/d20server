import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class ChatEntries extends Message {
    entries;
    append;
    historical;

    constructor(entries, append, historical) {
        super();
        this.entries = entries;
        this.append = append;
        this.historical = historical;
    }

    getEntries() {
        return this.entries;
    }

    doAppend() {
        return this.append;
    }

    isHistorical() {
        return this.historical;
    }
}
registerType(ChatEntries);
