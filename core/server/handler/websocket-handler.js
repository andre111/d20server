import websocket from 'ws';

import { fromJson } from '../../common/util/datautil.js';
import { MessageService } from '../service/message-service.js';
import { UserService } from '../service/user-service.js';

var wss = null;
export class WebsocketHandler {
    static init(server) {
        wss = new websocket.Server({ server: server, path: '/ws' });
        wss.on('connection', WebsocketHandler.connected);

        // track alive status and disconnect dropped clients
        // TODO: this may drop clients during loading
        setInterval(() => {
            wss.clients.forEach(ws => {
                if (!ws.isAlive) return ws.terminate();
                
                ws.isAlive = false;
                ws.ping(null, false, true);
            });
        }, 2 * 60 * 1000);
    }

    static connected(ws) {
        // track alive status
        ws.isAlive = true;
        ws.on('pong', () => {
            ws.isAlive = true;
        });

        // decode messages and call recieve
        ws.on('message', message => {
            const msg = fromJson(message);
            MessageService.recieve(ws, msg);
        });

        // listen for disconnect
        ws.on('close', (code, reason) => {
            UserService._onDisconnect(ws);
        });
    }
}
