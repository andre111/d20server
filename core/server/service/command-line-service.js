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
            const split = line.split(' ');

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
                    console.log('Usage: register <playername> <accesskey> <role(DEEFAULT,GM)>');
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
}
