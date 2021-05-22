import { Command } from './command.js';
import { EffectCommand } from './effect-command.js';
import { GetCommand } from './get-command.js';
import { IfCommand } from './if-command.js';
import { NotificationCommand } from './notification-command.js';
import { RollCommand } from './roll-command.js';
import { SayCommand } from './say-command.js';
import { SetCommand } from './set-command.js';
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

// register all the commands (this could use a better system)
Commands.register(new RollCommand('roll', ['r'], true, true, true));
Commands.register(new RollCommand('gmroll', ['gmr'], false, true, true));
Commands.register(new RollCommand('hiddenroll', ['hr'], false, true, false));
Commands.register(new GetCommand('get', ['g']));
Commands.register(new SetCommand('set', ['s'], true, false));
Commands.register(new SetCommand('gmset', ['gms'], false, false));
Commands.register(new SetCommand('hiddenset', ['hs'], false, true));
Commands.register(new WhisperCommand('whisper', ['w']));
Commands.register(new SayCommand('say', []));
Commands.register(new TemplateCommand('template', ['t'], true, true, true));
Commands.register(new TemplateCommand('gmtemplate', ['gmt'], false, true, true));
Commands.register(new TemplateCommand('hiddentemplate', ['ht'], false, true, false));
Commands.register(new TriggerCommand('trigger', []));
Commands.register(new EffectCommand('effect', []));
Commands.register(new IfCommand('if', []));
Commands.register(new NotificationCommand('notification', []));
