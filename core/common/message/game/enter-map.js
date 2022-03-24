// @ts-check
import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class EnterMap extends Message {
    mapID;
    fow;

    constructor(map, fow) {
        super();
        if (map) {
            this.mapID = map.getID();
            this.fow = fow;
        }
    }

    getMapID() {
        return this.mapID;
    }

    getFOW() {
        return this.fow;
    }
}
registerType(EnterMap);
