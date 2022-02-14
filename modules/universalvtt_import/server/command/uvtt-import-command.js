import fs from 'fs-extra';
import { splitArguments } from '../../../../core/common/util/stringutil.js';
import { Command } from '../../../../core/server/command/command.js';
import { readJsonFile } from '../../../../core/server/util/fileutil.js';
import { UniversalVTTImporter } from '../universal-vtt-importer.js';

export class UVTTImportCommand extends Command {
    constructor(name, aliases) {
        super(name, aliases, true);
    }

    execute(profile, args) {
        const splitArgs = splitArguments(args);
        if (splitArgs.length != 3) throw new Error(`Usage: /${this.getName()} <filePath> <name> <importLights>`);

        // check filePath
        const filePath = './data/files' + splitArgs[0];
        if (filePath.includes('..')) throw new Error('Invalid path'); //TODO: create a general reusable (and known safe) method for validating paths (to also use in file manager)!
        if (!fs.existsSync(filePath)) throw new Error('File does not exist');

        // read file
        const data = readJsonFile(filePath);
        if (!data.format || !data.resolution || !data.line_of_sight || !data.portals || !data.environment || !data.lights || !data.image) {
            throw new Error('File does not appear to be an Universal VTT file');
        }

        const name = splitArgs[1];
        const importLights = splitArgs[2].toLowerCase() == 'true';

        // perform import
        UniversalVTTImporter.import(name, data, importLights);
    }
}
