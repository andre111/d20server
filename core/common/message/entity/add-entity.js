import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class AddEntity extends Message {
    entity;

    constructor(entity) {
        super();
        this.entity = entity;
    }

    getEntity() {
        return this.entity;
    }
}
registerType(AddEntity);
