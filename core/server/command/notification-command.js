import { EntityManagers } from '../../common/entity/entity-managers.js';
import { SendNotification } from '../../common/messages.js';
import { splitArguments } from '../../common/util/stringutil.js';
import { MessageService } from '../service/message-service.js';
import { UserService } from '../service/user-service.js';
import { Command } from './command.js';

export class NotificationCommand extends Command {
    constructor(name, aliases) {
        super(name, aliases, true);
    }

    execute(profile, args) {
        const split = splitArguments(args, 2);
        if (split.length < 2) throw new Error('Usage: /notification <all/map/player:name> <message>');

        const target = split[0].toLowerCase();
        const message = split[1];
        const msg = new SendNotification(message, 5);

        if (target == 'all') {
            MessageService.broadcast(msg, null);
        } else if (target == 'map') {
            const map = EntityManagers.get('map').find(profile.getCurrentMap());
            if (!map) throw new Error('You do not have a map loaded');

            MessageService.broadcast(msg, map);
        } else if (target.startsWith('player:')) {
            const name = target.substring('player:'.length);

            // find receiver
            const reciever = UserService.findByUsername(name, true);
            if (!reciever) throw new Error(`Unknown player: ${name}`);

            MessageService.send(msg, reciever);
        }
    }
}
