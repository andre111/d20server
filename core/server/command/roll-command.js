import { Command } from './command.js';
import { RollFormatter } from '../util/roll-formatter.js';
import { ChatService } from '../service/chat-service.js';

import { Parser } from '../../common/scripting/expression/parser.js';
import { Context } from '../../common/scripting/context.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { ChatEntry } from '../../common/message/chat/chat-entry.js'; 

export class RollCommand extends Command {
    showPublic;
    showSelf;
    showGM;

    parser;

    constructor(name, aliases, showPublic, showSelf, showGM) {
        super(name, aliases, false);

        this.showPublic = showPublic;
        this.showSelf = showSelf;
        this.showGM = showGM;

        this.parser = new Parser();
    }

    execute(profile, args) {
        // parse roll and execute
        var result = null;
        var error = null;
        try {
            const expression = this.parser.parse(args);
            result = expression.eval(new Context(profile, EntityManagers.get('map').find(profile.getCurrentMap()), null));
        } catch(e) {
            error = e;
            console.log(e.stack);
        }

        const rollMessage = RollFormatter.formatDiceRoll(profile, args, this.showPublic, result, error);

        // determine recipents
        const recipents = this.buildRecipents(profile, this.showPublic, this.showSelf);

        // create entry
        const entry = new ChatEntry(rollMessage, profile.getID(), this.showGM, recipents);
        if(result) entry.setRolls(result.getDiceRolls());

        // append message
        ChatService.append(true, entry);
    }
}
