import readline from 'readline';
import { CLICommand } from './cli/cli-command.js';
import { CLICommandStop } from './cli/cli-command-stop.js';
import { CLICommandRegister } from './cli/cli-command-register.js';
import { CLICommandDebugImport } from './cli/cli-command-debug-import.js';
import { CLICommandHelp } from './cli/cli-command-help.js';
import { CLICommandKick } from './cli/cli-command-kick.js';
import { splitArguments } from '../../common/util/stringutil.js';
import { CLICommandStatus } from './cli/cli-command-status.js';

export var clicommands = {};
export function addCLICommand(command) {
    if (!(command instanceof CLICommand)) throw new Error('Can only add instances of CLICommand');
    if (clicommands[command.getName()]) throw new Error(`Command with the name ${command.getName()} is already registered`);
    clicommands[command.getName()] = command;
}
addCLICommand(new CLICommandStop());
addCLICommand(new CLICommandRegister());
addCLICommand(new CLICommandDebugImport());
addCLICommand(new CLICommandHelp());
addCLICommand(new CLICommandKick());
addCLICommand(new CLICommandStatus());

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
export class CommandLineService {
    static init() {
        console.log('Type "stop" to stop the server, or "help" for a list of commands');

        rl.on('line', line => {
            const split = splitArguments(line);
            const name = split[0];
            const args = split.slice(1);

            if (clicommands[name]) {
                clicommands[name].execute(args);
            } else {
                console.log('Unknown command, type "help" for a list of commands');
            }
        });
    }
}
