import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// parse command line arguments
export const PARAMETERS = yargs(hideBin(process.argv))
    .option('datadir', {
        alias: 'd',
        description: 'The directory to store all data in',
        type: 'string',
        default: 'data'
    })
    .option('port', {
        alias: 'p',
        description: 'The TCP Port the Server should bind to',
        type: 'number',
        default: 8082
    })
    .help()
    .alias('help', 'h')
    .argv;
