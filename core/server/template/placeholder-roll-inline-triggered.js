import { Placeholder } from './placeholder.js';

import { Parser } from '../../common/scripting/expression/parser.js';
import { Context } from '../../common/scripting/context.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { RollFormatter } from '../util/roll-formatter.js';
import { ChatEntry } from '../../common/message/chat/chat-entry.js';

export class PlaceholderRollInlineTriggered extends Placeholder {
    parser = new Parser();

    parse(profile, input, diceRolls, triggeredContent) {
        // parse roll and execute
        var result = null;
        var error = null;
        try {
            const expr = this.parser.parse(input);
            result = expr.eval(new Context(profile, EntityManagers.get('map').find(profile.getCurrentMap()), null));
        } catch(e) {
            error = e;
        }
        
        // store as triggered roll
        const entry = new ChatEntry(RollFormatter.formatInlineDiceRoll(input, result, error), profile.getID());
        if(result) entry.setRolls(result.getDiceRolls());
        triggeredContent.push({
            entry: entry,
            parent: null,
            triggerd: false
        });

        // build replaceable button
        return `<span id="${entry.getID()}" class="chat-dice-inline chat-button replaceable">Roll</span>`;
    }
}
