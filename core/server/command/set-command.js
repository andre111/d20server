import { Command } from './command.js';

import { Parser } from '../../common/scripting/expression/parser.js';
import { ChatService } from '../service/chat-service.js';
import { Context } from '../../common/scripting/context.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { parseVariable } from '../../common/scripting/variable/parser/variable-parsers.js';
import { Type } from '../../common/constants.js';
import { RollFormatter } from '../util/roll-formatter.js';
import { ChatEntry } from '../../common/message/chat/chat-entry.js';
import { splitArguments } from '../../common/util/stringutil.js';

export class SetCommand extends Command {
    showPublic;
    hidden;

    parser;

    constructor(name, aliases, showPublic, hidden) {
        super(name, aliases, false);

        this.showPublic = showPublic;
        this.hidden = hidden;

        this.parser = new Parser();
    }

    execute(profile, args) {
        const split = splitArguments(args, 3);
        if(split.length < 3) throw new Error('Wrong argument count: <variable> <type> <expression>');

        const context = new Context(profile, EntityManagers.get('map').find(profile.getCurrentMap()), null);

        const variable = parseVariable(split[0]);
        const type = split[1].toUpperCase();
        const valueString = split[2];

        if(type == Type.LONG || type == Type.DOUBLE) {
            // evaluate as expression
            const expr = this.parser.parse(valueString);
            const result = expr.eval(context);

            // cast and set
            if(type == Type.LONG) {
                variable.set(context, Math.trunc(result.getValue()));
            } else {
                variable.set(context, result.getValue());
            }

            // send roll message
            if(!this.hidden) {
                const rollMessage = RollFormatter.formatDiceRoll(profile, valueString, this.showPublic, result, null);
                const recipents = this.buildRecipents(profile, this.showPublic, true);
                const entry = new ChatEntry(rollMessage, profile.getID(), true, recipents);
                if(result) entry.setRolls(result.getDiceRolls());
                ChatService.append(true, entry);
            }
        } else if(type == Type.STRING) {
            variable.set(context, valueString);
        } else if(type == Type.BOOLEAN) {
            variable.set(context, valueString.toLowerCase() == 'true');
        } else if(type == Type.LAYER || type == Type.LIGHT || type == Type.EFFECT || type == Type.ACCESS) {
            //TODO: verification
            variable.set(context, valueString);
        } else {
            //TODO: handle more types (LONG_LIST?)
            throw new Error(`Cannot set value of Type: ${type}`);
        }
        //TODO: send info messsage
    }
}
