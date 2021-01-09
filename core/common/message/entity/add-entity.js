import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class AddEntity extends Message {
    type;
    entity;

    constructor(entity) {
        super();
        if(entity) {
            this.type = entity.getType();
            this.entity = entity;
        }
    }

    getType() {
        return this.type;
    }

    getEntity() {
        return this.entity;
    }
}
registerType(AddEntity);
