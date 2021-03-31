import { splitArguments } from '../../common/util/stringutil.js';
import { ChatService } from '../service/chat-service.js';
import { Command } from './command.js';

export class TriggerCommand extends Command {
    constructor(name, aliases) {
        super(name, aliases, false);
    }

    execute(profile, args) {
        const split = splitArguments(args);
        if(split.length != 2) throw 'Wrong argument count: <messageid> <contentid>';

        const messageID = Number(split[0]);
        const contentID = Number(split[1]);

        ChatService.triggerContent(profile, messageID, contentID);
    }
}
