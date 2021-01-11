import { Command } from './command.js';
import { ChatService } from '../service/chat-service.js';

import { EntityManagers } from '../../common/entity/entity-managers.js';
import { ChatEntry } from '../../common/message/chat/chat-entry.js';
import { Context } from '../../common/scripting/context.js';
import { parseVariable } from '../../common/scripting/variable/parser/variable-parsers.js';

export class SayCommand extends Command {
    constructor(name, aliases) {
        super(name, aliases);
    }

    execute(profile, args) {
        try {
            const variable = parseVariable('selected.property.name');
            const name = variable.get(new Context(profile, EntityManagers.get('map').find(profile.getCurrentMap()), null));

            var text = '<p class="chat-sender">' + ChatService.escape(''+name) + ' (' + ChatService.escape(profile.getUsername()) + '): </p>';
            text = text + '<p class="chat-message">' + ChatService.escape(args) + '</p>';

            ChatService.append(true, new ChatEntry(text, profile.getID()));
        } catch(error) {
            ChatService.appendNote(profile, `Could nor send message:`, `${error}`);
        }
    }
}
