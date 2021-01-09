import { registerType } from './util/datautil.js';
import { ID } from './entity/id.js';
import { Role } from './constants.js';

export class Profile {
    id;
    username;
    role;

    connected;
    currentMap;
    color;

    // TODO: these things should really be stored in a sepparate server only object!
    _notransfer_accessKey;
    _notransfer_created;
    _notransfer_lastLogin;
    _notransfer_selectedTokens;

    constructor(accessKey, username, role) {
        this._notransfer_accessKey = accessKey;
        this.username = username;
        this.role = role;

        //TODO: this._notransfer_created = ...
        //TODO: this._notransfer_lastLogin = ...
    }

    //TODO... remaining implementation
    getID() {
        if(this.id == null || this.id == undefined) this.id = ID.next();
        return this.id;
    }

    getUsername() {
        return this.username;
    }

    getRole() {
        return this.role;
    }

    isConnected() {
        return this.connected;
    }

    getCurrentMap() {
        return this.currentMap;
    }

    getColor() {
        return this.color;
    }

    getUnprivilegedCopy() {
        const copy = new Profile(this._notransfer_accessKey, this.username, this.role);
        copy.id = this.getID();
        copy.role = Role.DEFAULT;
        return copy;
    }
}
registerType(Profile);
