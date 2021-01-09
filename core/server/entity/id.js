
import { IDProvider } from '../../common/entity/id.js';
import { readJson, saveJson, backupJson } from '../util/fileutil.js';

export class ServerIDProvider extends IDProvider {
    nextID = 1;

    constructor() {
        super();

        this.nextID = readJson('ids');
        if(!this.nextID) this.nextID = 1;
    }

    next() {
        const id = this.nextID;
        this.nextID++;
        backupJson('ids');
        saveJson('ids', this.nextID);
        return id;
    }
}
