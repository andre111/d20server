import readline from 'readline';
import { CLICommand } from './cli/cli-command.js';
import { CLICommandStop } from './cli/cli-command-stop.js';
import { CLICommandRegister } from './cli/cli-command-register.js';
import { CLICommandDebugImport } from './cli/cli-command-debug-import.js';
import { CLICommandHelp } from './cli/cli-command-help.js';

export var clicommands = {};
export function addCLICommand(command) {
    if(!(command instanceof CLICommand)) throw new Error('Can only add instances of CLICommand');
    if(clicommands[command.getName()]) throw new Error(`Command with the name ${command.getName()} is already registered`);
    clicommands[command.getName()] = command;
}
addCLICommand(new CLICommandStop());
addCLICommand(new CLICommandRegister());
addCLICommand(new CLICommandDebugImport());
addCLICommand(new CLICommandHelp());

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
export class CommandLineService {
    static init() {
        console.log('Type "stop" to stop the server, or "help" for a list of commands');

        rl.on('line', line => {
            const split = CommandLineService.splitArguments(line);
            const name = split[0];
            const args = split.slice(1);

            if(clicommands[name]) {
                clicommands[name].execute(args);
            } else {
                console.log('Unknown command, type "help" for a list of commands');
            }
        });
    }

    // split line at "spaces but only outside Quotes" and "quotes" to sepparate arguments
    static splitArguments(line) {
        var split = [];

        var start = 0;
        var inQuotes = false;
        var shouldSplit = false;
        for(var i=0; i<=line.length; i++) {
            shouldSplit = false;
            if(i == line.length) {
                shouldSplit = true;
            } else if(line[i] == '"') {
                inQuotes = !inQuotes;
                shouldSplit = true;
            } else if(line[i] == ' ' && !inQuotes) {
                shouldSplit = true;
            }

            if(shouldSplit) {
                if(start != i) split.push(line.substring(start, i));
                start = i + 1;
            }
        }
        if(inQuotes) {
            console.log('Unclosed quotes');
            return [];
        }

        return split;
    }
}
