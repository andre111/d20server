// @ts-check
import { CLICommand } from './cli-command.js';
import { UserService } from '../user-service.js';

export class CLICommandStatus extends CLICommand {
    constructor() {
        super('status');
    }

    getDescription() {
        return 'Prints status of server and connected players';
    }

    getHelp() {
        return 'Prints status of server and connected players';
    }

    execute(args) {
        console.log(this.getSplitter());
        console.log('Connected Players: ');
        UserService.forEach(profile => console.log(`     ${profile.getUsername()} - ${profile.getRole()}`));
        console.log(this.getSplitter());
    }
}