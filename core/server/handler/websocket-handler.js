import websocket from 'ws';
import { Events } from '../../common/events.js';

import { fromJson } from '../../common/util/datautil.js';
import { UserService } from '../service/user-service.js';

var wss = null;
export class WebsocketHandler {
    static init(server) {
        wss = new websocket.Server({
            server: server,
            path: '/ws',
            perMessageDeflate: {
                zlibDeflateOptions: {
                    // See zlib defaults.
                    chunkSize: 1024,
                    memLevel: 7,
                    level: 3
                },
                zlibInflateOptions: {
                    chunkSize: 10 * 1024
                },
                concurrencyLimit: 5, // Limits zlib concurrency for perf.
                threshold: 1024 // Size (in bytes) below which messages should not be compressed if context takeover is disabled.
            }
        });
        wss.on('connection', WebsocketHandler.connected);

        // track alive status and disconnect dropped clients
        // TODO: this may drop clients during loading
        setInterval(() => {
            wss.clients.forEach(ws => {
                if (!ws.isAlive) return ws.terminate();

                ws.isAlive = false;
                ws.ping(null, false, true);
            });
        }, 1 * 60 * 1000);
    }

    static connected(ws) {
        // track alive status
        ws.isAlive = true;
        ws.on('pong', () => {
            ws.isAlive = true;
        });

        // decode messages and call recieve
        ws.on('message', message => {
            try {
                const msg = fromJson(message);
                const event = Events.trigger('recievedMessage', { message: msg, ws: ws, profile: null, map: null }, true);
                if (!event.canceled) {
                    throw new Error(`Recieved unhandled message: ${message}`);
                }
            } catch (error) {
                console.log(`Error during message recieve: ${error}`);
                if (error instanceof Error) console.log(error.stack);
            }
        });

        // listen for disconnect
        ws.on('close', (code, reason) => {
            UserService._onDisconnect(ws);
        });
    }
}
