import { EntityManagers } from '../../common/entity/entity-managers.js';
import { Context } from '../../common/scripting/context.js';
import { Parser } from '../../common/scripting/expression/parser.js';
import { ChatService } from '../service/chat-service.js';
import { Command } from './command.js';

export class IfCommand extends Command {
    parser;

    constructor(name, aliases) {
        super(name, aliases);

        this.parser = new Parser();
    }

    execute(profile, args) {
        try {
            // parse components
            args = args.trim();
            if(args.charAt(0) != '"') throw new Error('Wrong arguments: "<expression>" <condition> "<expression>" ...');
            var endIndex = args.indexOf('"', 1);
            if(endIndex < 0) throw new Error('Wrong arguments: "<expression>" <condition> "<expression>" ...');
            const firstExpression = args.substring(1, endIndex);

            args = args.substring(endIndex+1);
            endIndex = args.indexOf(' ', 1);
            if(endIndex < 0) throw new Error('Wrong arguments: "<expression>" <condition> "<expression>" ...');
            const comparison = args.substring(1, endIndex);

            args = args.substring(endIndex+1);
            if(args.charAt(0) != '"') throw new Error('Wrong arguments: "<expression>" <condition> "<expression>" ...');
            endIndex = args.indexOf('"', 1);
            if(endIndex < 0) throw new Error('Wrong arguments: "<expression>" <condition> "<expression>" ...');
            const secondExpression = args.substring(1, endIndex);

            const message = args.substring(endIndex+1).trim();

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
        } catch(error) {
            ChatService.appendNote(profile, 'Could not execute if command: ', `${error}`);
        }
    }
}
