import { ChatEntry } from '../../common/message/chat/chat-entry.js';
import { I18N } from '../../common/util/i18n.js';
import { splitArguments } from '../../common/util/stringutil.js';
import { ChatService } from '../service/chat-service.js';
import { Templates } from '../template/templates.js';
import { Command } from './command.js';

export class TemplateCommand extends Command {
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
        const split = splitArguments(args, 2);
        if (split.length < 2) throw new Error(I18N.get('commands.error.arguments', 'Wrong argument count: %0', '<name> <argument>[;<argument>[;...]]'));

        const name = split[0].toLowerCase();
        const templateArguments = split[1];

        // find template
        const template = Templates.get(name);
        if (!template) throw new Error(I18N.get('command.template.error.unknown', 'Unknown template: %0', name));

        // parse template
        var inputs = templateArguments.split(';');
        for (var i = 0; i < inputs.length; i++) inputs[i] = ChatService.escape(inputs[i]);
        const parseResult = template.parse(profile, inputs);

        // build message
        var text = '<div class="chat-sender">' + ChatService.escape(profile.getUsername()) + ': </div>';
        text = text + '<div class="chat-message">' + parseResult.string + '</div>';

        // determine recipents
        const recipents = this.buildRecipents(profile, this.showPublic, this.showSelf);

        // create entry
        const entry = new ChatEntry(text, profile.getID(), this.showGM, recipents);
        entry.setRolls(parseResult.diceRolls);
        entry.setTriggeredContent(parseResult.triggeredContent);

        // append message
        ChatService.append(true, entry);
    }
}
