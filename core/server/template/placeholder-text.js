import { Placeholder } from './placeholder.js';

import { EntityManagers } from '../../common/entity/entity-managers.js';
import { Context } from '../../common/scripting/context.js';
import { parseVariable } from '../../common/scripting/variable/parser/variable-parsers.js';

export class PlaceholderText extends Placeholder {
    parse(profile, input, diceRolls, triggeredContent) {
        // find and parse {variables} in string //TODO: Should this happen in normal chat messages or only in templates?
        var text = '';
        var index = 0;
        var startIndex = 0;
        while(startIndex < input.length) {
			// read normal string
			index = input.indexOf('{', startIndex);
			if(index == -1) index = input.length;
			text = text + input.substring(startIndex, index);
            startIndex = index;
            
            // read variable
			if(startIndex < input.length) {
				index = input.indexOf('}', startIndex);
				if(index == -1) throw new Error('Unclosed variable parenthesis');
				index = index + 1;
				const variableName = input.substring(startIndex+1, index-1);
				startIndex = index;
				
				const variable = parseVariable(variableName);
				const value = variable.get(new Context(profile, EntityManagers.get('map').find(profile.getCurrentMap()), null));
				text = text + value;
			}
        }

        return text;
    }
}
