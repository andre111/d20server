import { EntityManagers } from '../../common/entity/entity-managers.js';
import { PlayEffect } from '../../common/messages.js';
import { Scripting } from '../../common/scripting/scripting.js';
import { splitArguments } from '../../common/util/stringutil.js';
import { ChatService } from '../service/chat-service.js';
import { MessageService } from '../service/message-service.js';
import { Command } from './command.js';

const SCRIPT = new Scripting(false);
export class EffectCommand extends Command {
    static EFFECTS = [ 'PING' ];

    parser;

    constructor(name, aliases) {
        super(name, aliases, false);
    }

    execute(profile, args) {
        const split = splitArguments(args);
        if(split.length != 6) throw new Error('Wrong argument count: <type> <x:expression> <y:expression> <rotation:expression> <scale:expression> <aboveOcc:expression>');

        const map = EntityManagers.get('map').find(profile.getCurrentMap());

        const type = split[0];
        if(!EffectCommand.EFFECTS.includes(type)) throw new Error(`Unknown effect type: ${type}`);

        const x = SCRIPT.interpretExpression(ChatService.unescape(split[1]), profile, null);
        SCRIPT.throwIfErrored();
        const y = SCRIPT.interpretExpression(ChatService.unescape(split[2]), profile, null);
        SCRIPT.throwIfErrored();
        const rotation = SCRIPT.interpretExpression(ChatService.unescape(split[3]), profile, null);
        SCRIPT.throwIfErrored();
        const scale = SCRIPT.interpretExpression(ChatService.unescape(split[4]), profile, null);
        SCRIPT.throwIfErrored();
        const aboveOcc = SCRIPT.interpretExpression(ChatService.unescape(split[5]), profile, null);
        SCRIPT.throwIfErrored();

        MessageService.broadcast(new PlayEffect(type, x.value, y.value, rotation.value, scale.value, aboveOcc.isTruthy(), false), map);
    }
}
