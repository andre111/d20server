// @ts-check
import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class EnterGame extends Message {
    profile;
    editKey;

    constructor(profile, editKey) {
        super();
        this.profile = profile;
        this.editKey = editKey;
    }

    getProfile() {
        return this.profile;
    }

    getEditKey() {
        return this.editKey;
    }
}
registerType(EnterGame);
