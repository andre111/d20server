import { toJson, fromJson } from '../common/util/datautil.js';
import { MessageService } from './service/message-service.js';

var _ws = null;

export const Connection = {
    init: function(callback, closecallback) {
        _ws = new WebSocket('ws://'+location.host+'/ws');
        _ws.onopen = callback;
        _ws.onmessage = Connection.read;
        _ws.onclose = closecallback;
    },

    close: function() {
        _ws.close();
    },

    send(msg) {
        _ws.send(toJson(msg, true));
    },

    read(evt) {
        //TODO: remove debugging log messages
        const msg = fromJson(evt.data);
        //console.log('Decoded: ', msg);
        MessageService.recieve(msg);
    }
}
