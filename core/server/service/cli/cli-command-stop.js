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
        //TODO: cleanly implement stopping
        //TODO: very important: check if all "Datastores" are ready to shutdown
        process.exit(0);
    }
}
