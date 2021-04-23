import { EntityManagers } from '../../../common/entity/entity-managers.js';
import { CLICommand } from './cli-command.js';

export class CLICommandStop extends CLICommand {
    constructor() {
        super('stop');
    }

    getDescription() { 
        return 'Savely stops the Server';
    }

    getHelp() { 
        return 'Savely stops the Server';
    }

    execute(args) { 
        // very important: check if all "Datastores" are ready to shutdown
        for(const manager of EntityManagers.getAll()) {
            if(manager.isSaving()) {
                console.log('Saving in progress, please wait a few seconds and try again...');
                return;
            }
        }

        process.exit(0);
    }
}
