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
    #selectedTokens;

    constructor(username, role) {
        this.username = username;
        this.role = role;

        this.color = ColorUtils.randomSaturatedColor();

        this.created = new Date().getTime();
        this.lastLogin = new Date().getTime();
    }

    getID() {
        if (this.id == null || this.id == undefined) this.id = ID.next();
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
        if (forceSingle && this.#selectedTokens.length != 1) return null;

        const tokens = this.getSelectedTokens();
        return tokens.length > 0 ? tokens[0] : null;
    }

    getSelectedTokens() {
        if (!this.#selectedTokens) return [];

        const map = EntityManagers.get('map').find(this.currentMap);
        if (map) {
            const manager = map.getContainedEntityManager('token');
            if (manager) return this.#selectedTokens.map(id => manager.find(id)).filter(t => t);
        }
        return [];
    }

    setSelectedTokens(selectedTokens) {
        this.#selectedTokens = selectedTokens;
    }

    getUnprivilegedCopy() {
        const copy = new Profile(this.username, Role.DEFAULT);
        copy.id = this.getID();
        return copy;
    }
}
registerType(Profile);
