// @ts-check
import { Command } from './command.js';
import { RollFormatter } from '../util/roll-formatter.js';
import { ChatService } from '../service/chat-service.js';

import { ChatEntry } from '../../common/message/chat/chat-entry.js';
import { Scripting } from '../../common/scripting/scripting.js';
import { I18N } from '../../common/util/i18n.js';

const SCRIPT = new Scripting();
export class RollCommand extends Command {
    #showPublic;
    #showSelf;
    #showGM;
    #sendMessage;

    constructor(name, aliases, showPublic, showSelf, showGM) {
        super(name, aliases, false);

        this.#showPublic = showPublic;
        this.#showSelf = showSelf;
        this.#showGM = showGM;
        this.#sendMessage = showPublic || showSelf || showGM;
    }

    execute(profile, args) {
        // parse roll and execute
        const result = SCRIPT.interpretExpression(ChatService.unescape(args), profile, null);
        const diceRolls = SCRIPT.diceRolls;
        if (SCRIPT.errors.length != 0) {
            var error = SCRIPT.errors[0];
            if (SCRIPT.errors.length > 1) {
                error = error + `\nand ${SCRIPT.errors.length - 1} more`
            }
            ChatService.appendError(profile, error);
            return;
        }

        if (this.#sendMessage) {
            const rollAppendix = this.#showPublic ? '' : (this.#showGM ? I18N.get('command.roll.to.gm', ' (to GM)') : I18N.get('command.roll.to.self', ' (to Self)'));
            const rollMessage = RollFormatter.formatDiceRoll(profile, args, result, rollAppendix);

            // determine recipents
            const recipents = this.buildRecipents(profile, this.#showPublic, this.#showSelf);

            // create entry
            const entry = new ChatEntry(rollMessage, profile.getID(), this.#showGM, recipents);
            entry.setRolls(diceRolls);

            // append message
            ChatService.append(true, entry);
        }
    }
}
