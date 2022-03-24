// @ts-check
import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class ServerDefinitions extends Message {
    definitions;

    constructor(definitions) {
        super();
        this.definitions = definitions;
    }

    getDefinitions() {
        return this.definitions;
    }
}
registerType(ServerDefinitions);
