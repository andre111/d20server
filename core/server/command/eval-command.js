import { Command } from './command.js';
import { ChatService } from '../service/chat-service.js';

import { Scripting } from '../../common/scripting/scripting.js';

const SCRIPT = new Scripting();
export class EvalCommand extends Command {

    constructor(name, aliases) {
        super(name, aliases, false);
    }

    execute(profile, args) {
        // parse expression and execute
        SCRIPT.interpretExpression(ChatService.unescape(args), profile, null);
        if (SCRIPT.errors.length != 0) {
            var error = SCRIPT.errors[0];
            if (SCRIPT.errors.length > 1) {
                error = error + `\nand ${SCRIPT.errors.length - 1} more`
            }
            ChatService.appendError(error);
        }
    }
}
