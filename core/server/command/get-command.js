import { EntityManagers } from '../../common/entity/entity-managers.js';
import { Context } from '../../common/scripting/context.js';
import { parseVariable } from '../../common/scripting/variable/parser/variable-parsers.js';
import { ChatService } from '../service/chat-service.js';
import { Command } from './command.js';

export class GetCommand extends Command {
    constructor(name, aliases) {
        super(name, aliases, false);
    }

    execute(profile, args) {
        const variable = parseVariable(args);
        const value = variable.get(new Context(profile, EntityManagers.get('map').find(profile.getCurrentMap()), null));

        ChatService.appendNote(profile, ChatService.escape(args), ' = ' + ChatService.escape(''+value));
    }
}
