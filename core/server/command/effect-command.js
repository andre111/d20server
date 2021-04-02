import { EntityManagers } from '../../common/entity/entity-managers.js';
import { PlayEffect } from '../../common/messages.js';
import { Context } from '../../common/scripting/context.js';
import { Parser } from '../../common/scripting/expression/parser.js';
import { splitArguments } from '../../common/util/stringutil.js';
import { ChatService } from '../service/chat-service.js';
import { MessageService } from '../service/message-service.js';
import { Command } from './command.js';

export class EffectCommand extends Command {
    static EFFECTS = [ 'PING' ];

    parser;

    constructor(name, aliases) {
        super(name, aliases, false);

        this.parser = new Parser();
    }

    execute(profile, args) {
        const split = splitArguments(args);
        if(split.length != 6) throw new Error('Wrong argument count: <type> <x:expression> <y:expression> <rotation:expression> <scale:expression> <aboveOcc>');

        const map = EntityManagers.get('map').find(profile.getCurrentMap());
        const context = new Context(profile, map, null);

        const type = split[0];
        if(!EffectCommand.EFFECTS.includes(type)) throw new Error(`Unknown effect type: ${type}`);

        const x = this.parser.parse(split[1]).eval(context);
        const y = this.parser.parse(split[2]).eval(context);
        const rotation = this.parser.parse(split[3]).eval(context);
        const scale = this.parser.parse(split[4]).eval(context);

        const aboveOcc = split[5].toLowerCase() == 'true';

        MessageService.broadcast(new PlayEffect(type, x.getValue(), y.getValue(), rotation.getValue(), scale.getValue(), aboveOcc, false), map);
    }
}
