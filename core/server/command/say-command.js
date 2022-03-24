// @ts-check
import { Command } from './command.js';
import { ChatService } from '../service/chat-service.js';

import { ChatEntry } from '../../common/message/chat/chat-entry.js';
import { Scripting } from '../../common/scripting/scripting.js';

const SCRIPT = new Scripting(false);
const EXPR = SCRIPT.parseExpression('sActor.name');

export class SayCommand extends Command {
    constructor(name, aliases) {
        super(name, aliases, false);
    }

    execute(profile, args) {
        const name = SCRIPT.evalExpression(EXPR, profile, null);
        SCRIPT.throwIfErrored();

        // parse message
        const parsed = ChatService.parseInlineExpressions(args);

        var text = '<div class="chat-sender">' + ChatService.escape('' + name.value) + ' (' + ChatService.escape(profile.getUsername()) + '): </div>';
        text = text + '<div class="chat-message">' + parsed.string + '</div>';

        ChatService.append(true, new ChatEntry(text, profile.getID(), true, null, parsed.diceRolls, parsed.triggeredContent));
    }
}
