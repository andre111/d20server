import { CLICommand } from './cli-command.js';
import { importData } from '../../entity/importer.js';

export class CLICommandDebugImport extends CLICommand {
    constructor() {
        super('debugImport');
    }

    getDescription() { 
        return 'Internal Dev Command - DO NOT USE';
    }

    getHelp() { 
        return 'Internal Dev Command - DO NOT USE';
    }

    execute(args) { 
        //TODO: generalize with an actual good importer
        importData('./generated/', true);
    }
}
