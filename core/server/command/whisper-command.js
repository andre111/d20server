import { ChatEntry } from '../../common/message/chat/chat-entry.js';
import { ChatService } from '../service/chat-service.js';
import { UserService } from '../service/user-service.js';
import { Command } from './command.js';

export class WhisperCommand extends Command {
    constructor(name, aliases) {
        super(name, aliases);
    }

    execute(profile, args) {
        const split = args.split(' ');
        if(split.length < 2) {
            ChatService.appendNote(profile, 'Usage: /whisper <name> <message>');
            return;
        }

        const name = split[0].toLowerCase();
        const message = split.slice(1).join(' ');

        // find receiver
        var reciever = null;
        for(const profile of UserService.getAllProfiles()) {
            if(profile.getUsername().toLowerCase() == name) {
                reciever = profile;
                break;
            }
        }
        if(!reciever) {
            ChatService.appendNote(profile, `Unknown player: ${split[0]}`);
            return;
        }

        // build message
        var text = '<p class="chat-sender chat-sender-special">' + ChatService.escape(profile.getUsername()) + ' to ' + ChatService.escape(reciever.getUsername()) + ': </p>';
        text = text + '<p class="chat-message">' + ChatService.escape(message) + '</p>';

        // determine recipents
        const recipents = [ profile.getID(), reciever.getID() ];

        // append message
        ChatService.append(true, new ChatEntry(text, profile.getID(), false, recipents));
    }
}
