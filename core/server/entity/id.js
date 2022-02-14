
import { IDProvider } from '../../common/entity/id.js';
import { readJson, saveJson, backupJson } from '../util/fileutil.js';

export class ServerIDProvider extends IDProvider {
    nextID = 1;

    constructor() {
        super();

        this.nextID = readJson('id');
        if (!this.nextID) this.nextID = 1;
    }

    next() {
        const id = this.nextID;
        this.nextID++;
        backupJson('id');
        saveJson('id', this.nextID);
        return id;
    }
}
