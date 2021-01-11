import { Placeholder } from './placeholder.js';

import { Parser } from '../../common/scripting/expression/parser.js';
import { Context } from '../../common/scripting/context.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { RollFormatter } from '../util/roll-formatter.js';

export class PlaceholderRollInline extends Placeholder {
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
        if(result) {
            for(const diceRoll of result.getDiceRolls()) {
                diceRolls.push(diceRoll);
            }
        }

        return RollFormatter.formatInlineDiceRoll(input, result, error);
    }
}
