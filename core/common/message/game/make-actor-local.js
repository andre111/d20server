import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class MakeActorLocal extends Message {
    manager;
    tokenID;

    constructor(token) {
        super();
        if(token) {
            this.manager = token.getManager();
            this.tokenID = token.getID();
        }
    }

    getManager() {
        return this.manager;
    }

    getTokenID() {
        return this.tokenID;
    }
}
registerType(MakeActorLocal);
