import { EntityManagers } from '../../common/entity/entity-managers.js';
import { Context } from '../../common/scripting/context.js';
import { Parser } from '../../common/scripting/expression/parser.js';
import { splitArguments } from '../../common/util/stringutil.js';
import { ChatService } from '../service/chat-service.js';
import { Command } from './command.js';

export class IfCommand extends Command {
    parser;

    constructor(name, aliases) {
        super(name, aliases, false);

        this.parser = new Parser();
    }

    execute(profile, args) {
        // parse components
        const split = splitArguments(args, 4);
        if(split.length < 4) throw new Error('Wrong arguments: "<expression>" <condition> "<expression>" ...');

        const firstExpression = split[0];
        const comparison = split[1];
        const secondExpression = split[2];
        const message = split[3];

        // create context, parse and evalute expressions
        const context = new Context(profile, EntityManagers.get('map').find(profile.getCurrentMap()), null);

        const expr1 = this.parser.parse(firstExpression);
        const value1 = expr1.eval(context).getValue();
        const expr2 = this.parser.parse(secondExpression);
        const value2 = expr2.eval(context).getValue();

        // compare
        var isTrue = false;
        switch(comparison) {
        case '==': isTrue = value1 == value2; break;
        case '!=': isTrue = value1 != value2; break;
        case '>': isTrue = value1 > value2; break;
        case '<': isTrue = value1 < value2; break;
        case '>=': isTrue = value1 >= value2; break;
        case '<=': isTrue = value1 <= value2; break;
        default: throw new Error(`Unknown comparison type: ${comparison}`);
        }

        // send message/command if isTrue
        if(isTrue) {
            ChatService.onMessage(profile, message);
        }
    }
}
