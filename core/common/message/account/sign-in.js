// @ts-check
import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class SignIn extends Message {
    appVersion;
    username;
    password;

    constructor(appVersion, username, password) {
        super();
        this.appVersion = appVersion;
        this.username = username;
        this.password = password;
    }

    getAppVersion() {
        return this.appVersion;
    }

    getUsername() {
        return this.username;
    }

    getPassword() {
        return this.password;
    }

    requiresAuthentication() {
        return false;
    }
}
registerType(SignIn);
