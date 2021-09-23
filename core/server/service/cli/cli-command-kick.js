import { CLICommand } from './cli-command.js';
import { UserService } from '../user-service.js';

export class CLICommandKick extends CLICommand {
    constructor() {
        super('kick');
    }

    getDescription() { 
        return 'Kicks a connected player';
    }

    getHelp() { 
        return 'Kicks a connected player\n'+
        'Usage: register <kick>\n' + 
        '  playername: Name of the player, use quotes "" to enter names with spaces';
    }

    execute(args) { 
        try {
            if(args.length != 1) throw new Error('Invalid usage');
            var profile = UserService.findByUsername(args[0]);
            if(profile) {
                var ws = UserService.getWSFor(profile);
                if(ws) {
                    ws.close(4001, 'Kicked');
                    console.log(`Kicked ${args[0]}`);
                } else {
                    console.log(`Player ${args[0]} is not connected`);
                }
            } else {
                console.log(`Player ${args[0]} not found`);
            }
        } catch(error) {
            console.log(`${error}`);
            console.log('Usage: kick <playername>');
        }
    }
}