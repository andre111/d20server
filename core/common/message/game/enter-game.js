import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class EnterGame extends Message {
    profile;

    constructor(profile) {
        super();
        this.profile = profile;
    }

    getProfile() {
        return this.profile;
    }
}
registerType(EnterGame);
