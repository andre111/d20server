import { Role } from '../../common/constants.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { SendNotification } from '../../common/messages.js';
import { ChatService } from '../service/chat-service.js';
import { MessageService } from '../service/message-service.js';
import { UserService } from '../service/user-service.js';
import { Command } from './command.js';

export class NotificationCommand extends Command {
    constructor(name, aliases) {
        super(name, aliases);
    }

    execute(profile, args) {
        if(profile.getRole() != Role.GM) {
            ChatService.appendNote(profile, 'You do not have permission to use this command');
            return;
        }

        const split = args.split(' ');
        if(split.length < 2) {
            ChatService.appendNote(profile, 'Usage: /notification <all/map/player:name> <message>');
            return;
        }

        const target = split[0].toLowerCase();
        const message = split.slice(1).join(' ');
        const msg = new SendNotification(message, 5);

        if(target == 'all') {
            MessageService.broadcast(msg, null);
        } else if(target == 'map') {
            const map = EntityManagers.get('map').find(profile.getCurrentMap());
            if(!map) {
                ChatService.appendNote(profile, 'You do not have a map loaded');
                return;
            }
            MessageService.broadcast(msg, map);
        } else if(target.startsWith('player:')) {
            const name = target.substring('player:'.length);

            // find receiver
            var reciever = null;
            for(const profile of UserService.getAllProfiles()) {
                if(profile.getUsername().toLowerCase() == name) {
                    reciever = profile;
                    break;
                }
            }
            if(!reciever) {
                ChatService.appendNote(profile, `Unknown player: ${name}`);
                return;
            }

            MessageService.send(msg, profile);
        }
    }
}
