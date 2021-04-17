import { Command } from './command.js';
import { ChatService } from '../service/chat-service.js';

import { EntityManagers } from '../../common/entity/entity-managers.js';
import { ChatEntry } from '../../common/message/chat/chat-entry.js';
import { Context } from '../../common/scripting/context.js';
import { parseVariable } from '../../common/scripting/variable/parser/variable-parsers.js';

export class SayCommand extends Command {
    constructor(name, aliases) {
        super(name, aliases, false);
    }

    execute(profile, args) {
        const variable = parseVariable('selected.property.name');
        const name = variable.get(new Context(profile, EntityManagers.get('map').find(profile.getCurrentMap()), null));

        // parse message
        const parsed = ChatService.parseInlineRolls(args);

        var text = '<div class="chat-sender">' + ChatService.escape(''+name) + ' (' + ChatService.escape(profile.getUsername()) + '): </div>';
        text = text + '<div class="chat-message">' + parsed.string + '</div>';

        ChatService.append(true, new ChatEntry(text, profile.getID(), true, null, parsed.diceRolls, parsed.triggeredContent));
    }
}
