import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class EnterMap extends Message {
    mapID;

    constructor(map) {
        super();
        if(map) {
            this.mapID = map.getID();
        }
    }

    getMapID() {
        return this.mapID;
    }
}
registerType(EnterMap);
