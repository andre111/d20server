// @ts-check
import { EntityManagers } from "../../../../core/common/entity/entity-managers.js";
import { ChatEntry } from "../../../../core/common/message/chat/chat-entry.js";
import { I18N } from "../../../../core/common/util/i18n.js";
import { splitArguments } from "../../../../core/common/util/stringutil.js";
import { Command } from "../../../../core/server/command/command.js";
import { ChatService } from "../../../../core/server/service/chat-service.js";

export class PFUseCommand extends Command {
    constructor(name, aliases) {
        super(name, aliases, false);
    }

    execute(profile, args) {
        const argsSplit = splitArguments(args, 2);
        if (argsSplit.length != 2) throw new Error(I18N.get('commands.error.arguments', 'Wrong argument count: %0', '<entity> ...'));

        // find entity
        const entity = EntityManagers.findEntity(argsSplit[0]);
        if (entity == null || !entity.canView(profile)) {
            throw new Error(I18N.get('command.pf_use.error.noentity', 'Entity not found or accessible'));
        }

        // act on entity type
        if (entity.getType() === 'attachment' && entity.getString('type') === 'pf_spell_de') {
            this.#useSpell(profile, entity, argsSplit[1]);
        } else {
            throw new Error(I18N.get('command.pf_use.error.unsupported', 'Unsupported entity type: %0', entity.getType()));
        }
    }

    #useSpell(profile, spell, args) {
        // build formatted message and send to chat
        var text = '<div class="chat-sender">' + ChatService.escape(profile.getUsername()) + ': </div>';
        text += '<div class="chat-message">';

        //TODO: implement actual (nice looking) formatting
        text += `<div class="chat-box pf-spell" data-entity="${spell.getPath()}">`;
        {
            text += '<div class="chat-box-header pf-spell">';
            text += `<span><a href="#" class="internal-link" data-target="${spell.getManager()}:${spell.getID()}" data-property="name"></a></span><br>`; //TODO: convert internal links to use entity paths and switch this to spell.getPath()
            text += '<p data-property="pf_school"></p>';
            text += '</div>';

            text += '<div class="chat-box-content pf-spell">';
            {
                // "properties table"
                text += '<table>';
                text += this.#getPropertyRow(spell, 'castingTime');
                text += this.#getPropertyRow(spell, 'components');
                text += this.#getPropertyRow(spell, 'range');
                text += this.#getPropertyRow(spell, 'target');
                text += this.#getPropertyRow(spell, 'effect');
                text += this.#getPropertyRow(spell, 'area');
                text += this.#getPropertyRow(spell, 'duration');
                text += this.#getPropertyRow(spell, 'save');
                text += this.#getPropertyRow(spell, 'sr');
                text += '</table>';
                // "throws"
                const buttons = args.split(';');
                for (let i = 0; i < buttons.length; i += 2) {
                    const buttonName = ChatService.escape(buttons[i]);
                    const buttonContent = buttons[i + 1];
                    text += `<span data-command="chat:${buttonContent}" class="chat-button">${buttonName}</span>`;
                }
                // description
                text += `<div class="pf-spell-description" data-property="descFull"></div>`;
            }
            text += '</div>';
        }
        text += '</div>';

        //
        text += '</div>';

        // determine recipents
        const recipents = this.buildRecipents(profile, true, true);

        // append message
        ChatService.append(true, new ChatEntry(text, profile.getID(), true, recipents));
    }

    #getPropertyRow(spell, propertyWithoutPF) {
        if (spell.getString('pf_' + propertyWithoutPF)) {
            return `<tr><th>${I18N.get('pf.spell.' + propertyWithoutPF, propertyWithoutPF)}:</th><td data-property="${'pf_' + propertyWithoutPF}"></td></tr>`;
        } else {
            return '';
        }
    }
}
