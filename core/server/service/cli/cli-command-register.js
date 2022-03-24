// @ts-check
import { CLICommand } from './cli-command.js';
import { UserService } from '../user-service.js';
import { Role } from '../../../common/constants.js';

export class CLICommandRegister extends CLICommand {
    constructor() {
        super('register');
    }

    getDescription() {
        return 'Registers a new Account';
    }

    getHelp() {
        return 'Registers a new Account\n' +
            'Usage: register <playername> <accesskey> <role>\n' +
            '  playername: Name of the player, use quotes "" to enter names with spaces\n' +
            '  accesskey: Key used to access this account, CURRENTLY TRANSMITTED UNENCRYPTED!\n' +
            '  role: Determines account privileges: either DEFAULT or GM';
    }

    execute(args) {
        try {
            if (args.length != 3) throw new Error('Invalid usage');
            if (args[2] != Role.DEFAULT && args[2] != Role.GM) throw new Error('Invalid role');
            UserService.createProfile(args[0], args[1], args[2]);
            console.log('Registered ' + args[0]);
        } catch (error) {
            console.log(`${error}`);
            console.log('Usage: register <playername> <accesskey> <role(DEFAULT,GM)>');
        }
    }
}