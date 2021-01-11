import { Message } from '../../common/message/message.js';
import { toJson } from '../../common/util/datautil.js';
import { MessageHandler } from '../handler/message-handler.js';
import { UserService } from './user-service.js';

export class MessageService {
    // RECIEVING
    static recieve(ws, message) {
        try {
            MessageHandler.handle(ws, message);
        } catch(error) {
            console.log(`Error during message recieve: ${error}`);
            if(error instanceof Error) console.log(error.stack);
        }
    }

    // SENDING
    static send(message, profile) {
        MessageService._send(message, UserService.getWSFor(profile));
    }

    static broadcast(message, map) {
        UserService.forEach(profile => {
            if(map && map.getID() != profile.getCurrentMap()) return; // check for map or broadcast to all if non specified

            MessageService.send(message, profile);
        });
    }

    static _send(message, ws) {
        if(!message || !ws) return;
        if(!(message instanceof Message)) throw new Error('Can only send instances of message');

        ws.send(toJson(message, true));
    }
}
