import { CLICommand } from './cli-command.js';
import { SaveService } from '../save-service.js';

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
        //TODO: cleanly implement stopping
        if(SaveService.isBusy()) {
            console.log('Saving in progress, please wait a few seconds and try again...');
        } else {
            process.exit(0);
        }
    }
}
