import * as Turn from 'node-turn';

import { Events } from '../../../core/common/events.js';
import { HttpHandler } from '../../../core/server/handler/http-handler.js';
import { MessageService } from '../../../core/server/service/message-service.js';
import { WebRTCMessage } from '../common/message/webrtc-message.js';

// create TURN/STUN server (only when encryption is enabled, it would not be used in the other case)
Events.on('serverInit', event => {
    if(HttpHandler.isHTTPS()) {
        const turnServer = new Turn({ authMech: 'none', minPort: 49152, maxPort: 49152 + 255 });
        turnServer.start();
    }
});

// simply broadcast any WebRTCMessage communications (but include sender)
Events.on('recievedMessage', event => {
    if(event.data.message instanceof WebRTCMessage) {
        event.data.message.sender = event.data.profile.getID();
        MessageService.broadcast(event.data.message);

        event.cancel();
    }
});
