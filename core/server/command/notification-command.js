// @ts-check
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { SendNotification } from '../../common/messages.js';
import { I18N } from '../../common/util/i18n.js';
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
        if (split.length < 2) throw new Error(I18N.get('commands.error.arguments', 'Wrong argument count: %0', '<all/map/player:name> <message>'));

        const target = split[0].toLowerCase();
        const message = split[1];
        const msg = new SendNotification(message, 5);

        if (target == 'all') {
            MessageService.broadcast(msg, null);
        } else if (target == 'map') {
            const map = EntityManagers.get('map').find(profile.getCurrentMap());
            if (!map) throw new Error(I18N.get('command.notification.error.nomap', 'You do not have a map loaded'));

            MessageService.broadcast(msg, map);
        } else if (target.startsWith('player:')) {
            const name = target.substring('player:'.length);

            // find receiver
            const reciever = UserService.findByUsername(name, true);
            if (!reciever) throw new Error(I18N.get('command.notification.error.noplayer', 'Unknown player: %0', name));

            MessageService.send(msg, reciever);
        }
    }
}
