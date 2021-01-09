import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class TokenListValue extends Message {
    listID;
    tokenID;
    value;
    hidden;
    reset;

    constructor(list, tokenID, value, hidden, reset) {
        super();
        if(list) {
            this.listID = list.getID();
            this.tokenID = tokenID;
            this.value = value;
            this.hidden = hidden;
            this.reset = reset;
        }
    }

    getListID() {
        return this.listID;
    }

    getTokenID() {
        return this.tokenID;
    }

    getValue() {
        return this.value;
    }

    isHidden() {
        return this.hidden;
    }

    doReset() {
        return this.reset;
    }
}
registerType(TokenListValue);
