import { ChatService } from '../service/chat-service.js';
import { Command } from './command.js';

export class TriggerCommand extends Command {
    constructor(name, aliases) {
        super(name, aliases);
    }

    execute(profile, args) {
        try {
            const split = args.split(' ');
            if(split.length != 2) throw new Error('Wrong argument count: <messageid> <contentid>');

            const messageID = Number(split[0]);
            const contentID = Number(split[1]);

            ChatService.triggerContent(profile, messageID, contentID);
        } catch(error) {
            ChatService.appendNote(profile, 'Could not execute trigger: ', `${error}`);
        }
    }
}
