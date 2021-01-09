import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class UpdateEntityProperties extends Message {
    type;
    id;
    properties;

    constructor(type, id, properties) {
        super();
        this.type = type;
        this.id = id;
        this.properties = properties;
    }

    getType() {
        return this.type;
    }

    getID() {
        return this.id;
    }

    getProperties() {
        return this.properties;
    }
}
registerType(UpdateEntityProperties);
