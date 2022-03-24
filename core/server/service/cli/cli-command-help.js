// @ts-check
import { CLICommand } from './cli-command.js';
import { clicommands } from '../command-line-service.js';

export class CLICommandHelp extends CLICommand {
    constructor() {
        super('help');
    }

    getDescription() {
        return 'Prints this help page';
    }

    getHelp() {
        return 'Woah recursion...';
    }

    execute(args) {
        const splitter = this.getSplitter();
        if (!args || args.length == 0) {
            // print general help
            console.log('');
            console.log(splitter);
            console.log('Available commands: ');
            console.log(splitter);
            console.group('Command', '-', 'Description');
            for (const [name, command] of Object.entries(clicommands)) {
                //console.log(`    ${name} - ${command.getDescription()}`);
                console.log(name, '-', command.getDescription());
            }
            console.groupEnd();
            console.log(splitter);
            console.log('Type "help <command>" for detailed command usage');
            console.log(splitter);
            console.log('');
        } else {
            const command = clicommands[args[0]];
            if (command) {
                // print command help
                console.log('');
                console.log(splitter);
                console.log(`Help for "${command.getName()}"`);
                console.log(splitter);
                console.log(command.getHelp());
                console.log(splitter);
                console.log('');
            } else {
                console.log('Unknown command');
            }
        }
    }
}