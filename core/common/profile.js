import { registerType } from './util/datautil.js';
import { ID } from './entity/id.js';
import { Role } from './constants.js';
import { EntityManagers } from './entity/entity-managers.js';
import { ColorUtils } from './util/colorutil.js';

export class Profile {
    id;
    username;
    role;

    connected;
    currentMap;
    color;

    created;
    lastLogin;
    // TODO: these things should really be stored in a sepparate server only object!
    _notransfer_selectedTokens;

    constructor(username, role) {
        this.username = username;
        this.role = role;

        this.color = ColorUtils.randomSaturatedColor();

        this.created = new Date().getTime();
        this.lastLogin = new Date().getTime();
    }

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

    setConnected(connected) {
        this.connected = connected;
    }

    getCurrentMap() {
        return this.currentMap;
    }

    setCurrentMap(currentMap) {
        this.currentMap = currentMap;
    }

    getColor() {
        return this.color;
    }

    setColor(color) {
        this.color = color;
    }

    setLastLogin() {
        this.lastLogin = new Date().getTime();
    }

    getSelectedToken(forceSingle) {
        if(!this._notransfer_selectedTokens) return null;
        if(forceSingle && this._notransfer_selectedTokens.length != 1) return null;

        const token = EntityManagers.get('token').find(this._notransfer_selectedTokens[0]);
        return token;
    }

    setSelectedTokens(selectedTokens) {
        this._notransfer_selectedTokens = selectedTokens;
    }

    getUnprivilegedCopy() {
        const copy = new Profile(this._notransfer_accessKey, this.username, this.role);
        copy.id = this.getID();
        copy.role = Role.DEFAULT;
        return copy;
    }
}
registerType(Profile);
