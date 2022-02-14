import { ChatEntry } from '../../common/message/chat/chat-entry.js';
import { I18N } from '../../common/util/i18n.js';
import { splitArguments } from '../../common/util/stringutil.js';
import { ChatService } from '../service/chat-service.js';
import { UserService } from '../service/user-service.js';
import { Command } from './command.js';

export class WhisperCommand extends Command {
    constructor(name, aliases) {
        super(name, aliases, false);
    }

    execute(profile, args) {
        const split = splitArguments(args, 2);
        if (split.length < 2) throw new Error(I18N.get('commands.error.arguments', 'Wrong argument count: %0', '<name> <message>'));

        const name = split[0].toLowerCase();
        const message = split[1];

        // find receiver
        const reciever = UserService.findByUsername(name, true);
        if (!reciever) throw new Error(`Unknown player: ${split[0]}`);

        // parse message
        const parsed = ChatService.parseInlineExpressions(message, profile);

        // build message
        var text = '<div class="chat-sender chat-sender-special">' + I18N.get('command.whisper.title', '%0 to %1: ', ChatService.escape(profile.getUsername()), ChatService.escape(reciever.getUsername())) + '</div>';
        text = text + '<div class="chat-message">' + parsed.string + '</div>';

        // determine recipents
        const recipents = [profile.getID(), reciever.getID()];

        // append message
        ChatService.append(true, new ChatEntry(text, profile.getID(), false, recipents, parsed.diceRolls, parsed.triggeredContent));
    }
}
