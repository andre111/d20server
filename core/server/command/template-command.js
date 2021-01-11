import { ChatEntry } from '../../common/message/chat/chat-entry.js';
import { ChatService } from '../service/chat-service.js';
import { Templates } from '../template/templates.js';
import { Command } from './command.js';

export class TemplateCommand extends Command {
    showPublic;
    showSelf;
    showGM;

    constructor(name, aliases, showPublic, showSelf, showGM) {
        super(name, aliases);

        this.showPublic = showPublic;
        this.showSelf = showSelf;
        this.showGM = showGM;
    }

    execute(profile, args) {
        try {
            const split = args.split(' ');
            if(split.length < 2) throw new Error('Usage: /template <name> <argument>[;<argument>[;...]]');

            const name = split[0].toLowerCase();
            const templateArguments = split.slice(1).join(' ');

            // find template
            const template = Templates.get(name);
            if(!template) throw new Error(`Unknown template: ${name}`);

            // parse template
            var inputs = templateArguments.split(';');
            for(var i=0; i<inputs.length; i++) inputs[i] = ChatService.escape(inputs[i]);
            const parseResult = template.parse(profile, inputs);

            // build message
            var text = '<p class="chat-sender">' + ChatService.escape(profile.getUsername()) + ': </p>';
            text = text + '<p class="chat-message">'+parseResult.string+'</p>';

            // determine recipents
            const recipents = this.buildRecipents(profile, this.showPublic, this.showSelf);

            // create entry
            const entry = new ChatEntry(text, profile.getID(), this.showGM, recipents);
            entry.setRolls(parseResult.diceRolls);
            entry.setTriggeredContent(parseResult.triggeredContent);

            // append message
            ChatService.append(true, entry);
        } catch(error) {
            ChatService.appendNote(profile, 'Could not use template: ', `${error}`);
        }
    }
}
