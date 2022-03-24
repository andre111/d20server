// @ts-check
import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class UpdateEntityProperties extends Message {
    manager;
    id;
    properties;

    constructor(manager, id, properties) {
        super();
        this.manager = manager;
        this.id = id;
        this.properties = properties;
    }

    getManager() {
        return this.manager;
    }

    getID() {
        return this.id;
    }

    getProperties() {
        return this.properties;
    }
}
registerType(UpdateEntityProperties);
