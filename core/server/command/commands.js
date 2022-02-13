import { Role } from '../../common/constants.js';
import { Events } from '../../common/events.js';

import { ChatService } from '../service/chat-service.js';
import { Command } from './command.js';
import { EffectCommand } from './effect-command.js';
import { EvalCommand } from './eval-command.js';
import { IfCommand } from './if-command.js';
import { NotificationCommand } from './notification-command.js';
import { RollCommand } from './roll-command.js';
import { SayCommand } from './say-command.js';
import { TemplateCommand } from './template-command.js';
import { TriggerCommand } from './trigger-command.js';
import { WhisperCommand } from './whisper-command.js';

//TODO: build a generic unified argument parser (multiple commands (attempt to) parse profile names with duplicated code currently)
const COMMANDS_MAP = new Map();
function register(command, name) {
    if(!(command instanceof Command)) throw new Error('Can only register instances of Command');
    if(COMMANDS_MAP.has(name)) throw new Error(`Command with name ${name} was already registered`);
    COMMANDS_MAP.set(name, command);
}

export class Commands {
    static register(command) {
        if(!(command instanceof Command)) throw new Error('Can only register instances of Command');
        register(command, command.getName());
        if(command.getAliases()) {
            for(const alias of command.getAliases()) {
                register(command, alias);
            }
        }
    }

    static get(name) {
        name = name.toLowerCase();
        return COMMANDS_MAP.get(name);
    }
}

// Handle Commands
Events.on('chatMessage', event => {
    const message = event.data.message;
    const profile = event.data.profile;
    
    if(message.startsWith('/')) {
        event.cancel();

        // extract command name and arguments
        var endIndex = message.indexOf(' ');
        if(endIndex < 0) endIndex = message.length;
        const commandName = message.substring(1, endIndex);
        const commandArgs = message.substring(Math.min(endIndex+1, message.length));
        
        const command = Commands.get(commandName);
        if(command) {
            if(command.requiresGM() && profile.getRole() != Role.GM) {
                ChatService.appendError(profile, 'You do not have permission to use this command');
                return;
            }

            // handle command
            try {
                command.execute(profile, commandArgs);
            } catch(error) {
                ChatService.appendError(profile, `Error in /${commandName}:`, `${error}`);
                if(error instanceof Error) console.log(error.stack);
            }
        } else {
            ChatService.appendError(profile, `Unknown command: ${commandName}`);
        }
    }
});

// register all the commands (this could use a better system)
Commands.register(new RollCommand('roll', ['r'], true, true, true));
Commands.register(new RollCommand('gmroll', ['gmr'], false, true, true));
Commands.register(new RollCommand('selfroll', ['sr'], false, true, false));
Commands.register(new RollCommand('hiddenroll', ['hr'], false, false, false));
Commands.register(new WhisperCommand('whisper', ['w']));
Commands.register(new SayCommand('say', []));
Commands.register(new TemplateCommand('template', ['t'], true, true, true));
Commands.register(new TemplateCommand('gmtemplate', ['gmt'], false, true, true));
Commands.register(new TemplateCommand('selftemplate', ['st'], false, true, false));
Commands.register(new TriggerCommand('trigger', []));
Commands.register(new EffectCommand('effect', []));
Commands.register(new IfCommand('if', []));
Commands.register(new NotificationCommand('notification', []));
Commands.register(new EvalCommand('eval', []));
