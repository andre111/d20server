import fs from 'fs-extra';
import { Role } from '../../../../core/common/constants.js';
import { splitArguments } from '../../../../core/common/util/stringutil.js';
import { Command } from '../../../../core/server/command/command.js';
import { ChatService } from '../../../../core/server/service/chat-service.js';
import { readJsonFile } from '../../../../core/server/util/fileutil.js';
import { UniversalVTTImporter } from '../universal-vtt-importer.js';

export class UVTTImportCommand extends Command {
    constructor(name, aliases) {
        super(name, aliases);
    }

    execute(profile, args) {
        //TODO: this should probably be put in a unified place (a needsGM setting in Command)
        if(profile.getRole() != Role.GM) {
            ChatService.appendNote(profile, 'Can only be used by GMs');
            return;
        }

        const splitArgs = splitArguments(args);
        if(splitArgs.length != 3) {
            //TODO: usage should probably be reported automatically, just return a non empty string on error?
            ChatService.appendNote(profile, `Usage: /${this.name} <filePath> <name> <importLights>`);
            return;
        }

        // check filePath
        const filePath = './data/files'+splitArgs[0];
        if(filePath.includes('..')) return; //TODO: create a general reusable (and known safe) method for validating paths (to also use in file manager)!
        if(!fs.existsSync(filePath)) {
            ChatService.appendNote(profile, 'File does not exist');
            return;
        }

        // read file
        const data = readJsonFile(filePath);
        if(!data.format || !data.resolution || !data.line_of_sight || !data.portals || !data.environment || !data.lights || !data.image) {
            ChatService.appendNote(profile, 'File does not appear to be an Universal VTT file');
            return;
        }

        const name = splitArgs[1];
        const importLights = splitArgs[2].toLowerCase() == 'true';

        // perform import
        UniversalVTTImporter.import(name, data, importLights);
    }
}
