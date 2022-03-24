// @ts-check
import { Events } from '../common/events.js';
import { toJson, fromJson } from '../common/util/datautil.js';

var _ws = null;

export const Connection = {
    init: function (callback, closecallback) {
        var path = location.protocol == 'https:' ? 'wss://' + location.host + '/ws' : 'ws://' + location.host + '/ws';
        _ws = new WebSocket(path);
        _ws.onopen = callback;
        _ws.onmessage = Connection.read;
        _ws.onclose = closecallback;
    },

    close: function () {
        _ws.close();
    },

    send(msg) {
        _ws.send(toJson(msg));
    },

    read(evt) {
        const msg = fromJson(evt.data);
        //console.log('Decoded: ', msg);
        Events.trigger('recievedMessage', { message: msg }, true);
    }
}
