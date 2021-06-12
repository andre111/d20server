import { Placeholder } from './placeholder.js';

import { ChatService } from '../service/chat-service.js';

export class PlaceholderRollInlineTriggered extends Placeholder {
    parse(profile, input, diceRolls, triggeredContent) {
        const parsed = ChatService.parseInlineExpressions('|?'+input+'|', profile);

        for(const diceRoll of parsed.diceRolls) diceRolls.push(diceRoll);
        for(const tC of parsed.triggeredContent) triggeredContent.push(tC);
        return parsed.string;
    }
}
