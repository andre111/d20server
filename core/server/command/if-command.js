import { Scripting } from '../../common/scripting/scripting.js';
import { splitArguments } from '../../common/util/stringutil.js';
import { ChatService } from '../service/chat-service.js';
import { Command } from './command.js';

const SCRIPT = new Scripting(false);
export class IfCommand extends Command {
    parser;

    constructor(name, aliases) {
        super(name, aliases, false);
    }

    execute(profile, args) {
        // parse components
        const split = splitArguments(args, 2);
        if(split.length < 2) throw new Error('Wrong arguments: <expression> ...');

        const expression = split[0];
        const message = split[1];

        // evalute expression
        const result = SCRIPT.interpretExpression(ChatService.unescape(expression), profile, null);
        SCRIPT.throwIfErrored();

        // send message/command if isTrue
        if(result.isTruthy()) {
            ChatService.onMessage(profile, message);
        }
    }
}
