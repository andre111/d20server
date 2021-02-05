import readline from 'readline';
import { Role } from '../../common/constants.js';
import { importData } from '../entity/importer.js';
import { SaveService } from './save-service.js';
import { UserService } from './user-service.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
export class CommandLineService {
    static init() {
        rl.on('line', line => {
            const split = CommandLineService.splitArguments(line);

            switch(split[0]) {
            case 'debugImport':
                //TODO: generalize with an actual good importer
                importData('../d20helper/generated/', true);
                break;
            case 'register':
                try {
                    if(split.length != 4) throw new Error('Invalid usage');
                    if(split[3] != Role.DEFAULT && split[3] != Role.GM) throw new Error('Invalid role');
                    UserService.createProfile(split[1], split[2], split[3]);
                    console.log('Registered '+split[1]);
                } catch(error) {
                    console.log(`${error}`);
                    console.log('Usage: register <playername> <accesskey> <role(DEFAULT,GM)>');
                }
                break;
            case 'stop':
                //TODO: cleanly implement stopping
                if(SaveService.isBusy()) {
                    console.log('Saving in progress, please wait a few seconds and try again...');
                } else {
                    process.exit(0);
                }
                break;
            }
        });
    }

    // split line at "' ' but only outside Quotes" and "quotes" to sepparate arguments
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
