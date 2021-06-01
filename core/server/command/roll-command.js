import { Command } from './command.js';
import { RollFormatter } from '../util/roll-formatter.js';
import { ChatService } from '../service/chat-service.js';

import { ChatEntry } from '../../common/message/chat/chat-entry.js'; 
import { Scripting } from '../../common/scripting/scripting.js';

const SCRIPT = new Scripting();
export class RollCommand extends Command {
    showPublic;
    showSelf;
    showGM;

    constructor(name, aliases, showPublic, showSelf, showGM) {
        super(name, aliases, false);

        this.showPublic = showPublic;
        this.showSelf = showSelf;
        this.showGM = showGM;
    }

    execute(profile, args) {
        // parse roll and execute
        const result = SCRIPT.interpretExpression(ChatService.unescape(args), profile, null);
        const diceRolls = SCRIPT.diceRolls;
        var error = null;
        if(SCRIPT.errors.length != 0) {
            error = SCRIPT.errors[0];
            if(SCRIPT.errors.length > 1) {
                error = error + `\nand ${SCRIPT.errors.length-1} more`
            }
        }

        const rollMessage = RollFormatter.formatDiceRoll(profile, args, this.showPublic, result, diceRolls, error);

        // determine recipents
        const recipents = this.buildRecipents(profile, this.showPublic, this.showSelf);

        // create entry
        const entry = new ChatEntry(rollMessage, profile.getID(), this.showGM, recipents);
        entry.setRolls(diceRolls);

        // append message
        ChatService.append(true, entry);
    }
}
