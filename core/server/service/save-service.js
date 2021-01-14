import { EntityManagers } from '../../common/entity/entity-managers.js';

var requestingSave = [];
var busy = false;

async function run() {
    while(requestingSave.length > 0) {
        busy = true;
        const type = requestingSave.pop();
        try {
            EntityManagers.get(type)._performSave(true);
        } catch(error) {
            console.log(`Error trying to save: ${type}: ${error}`);
            if(error instanceof Error) console.log(error.trace);
        }
        busy = false;
    }
}

export class SaveService {
    static init() {
        setInterval(run, 5 * 1000);
    }

    static requestSave(type) {
        if(!requestingSave.includes(type)) requestingSave.push(type);
    }

    static isBusy() {
        return busy || requestingSave.length > 0;
    }
}
