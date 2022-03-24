// @ts-check
import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class MovePlayerToMap extends Message {
    playerID;
    mapID;

    constructor(map, profile) {
        super();
        if (map) {
            this.playerID = profile ? profile.getID() : 0;
            this.mapID = map.getID();
        }
    }

    getPlayerID() {
        return this.playerID;
    }

    getMapID() {
        return this.mapID;
    }
}
registerType(MovePlayerToMap);
