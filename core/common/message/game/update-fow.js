import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class UpdateFOW extends Message {
    mapID;
    fow;

    constructor(map, fow, reset = false) {
        super();
        if (map) {
            this.mapID = map.getID();
            this.fow = fow;
            this.reset = reset;
        }
    }

    getMapID() {
        return this.mapID;
    }

    getFOW() {
        return this.fow;
    }

    getReset() {
        return this.reset;
    }
}
registerType(UpdateFOW);
