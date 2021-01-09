import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class SetActorDefaultToken extends Message {
    actorID;

    constructor(actorID) {
        super();
        this.actorID = actorID;
    }

    getActorID() {
        return this.actorID;
    }
    
    requiresMap() {
        return true;
    }
}
registerType(SetActorDefaultToken);
