// @ts-check
import { AmbientSoundManager } from './ambient-sound-manager.js';

import { MapUtils } from '../../../core/client/util/maputil.js';

var performedInit = false;
var managers = new Map();
export const AmbientAudio = {
    init: function () {
        if (performedInit) return;

        // initialise reverb convolver (needs to have a howl created first to work!)
        // @ts-ignore
        new Howl({ src: '/modules/audio/files/ir.wav', autoplay: false });
        // @ts-ignore
        Howler.addConvolver('reverb', '/modules/audio/files/ir.wav');
        performedInit = true;
    },

    update: function (hasListener, listenerX, listenerY, listenerZ) {
        // update listener position
        if (!hasListener) {
            AmbientAudio.stop();
            return;
        }
        // @ts-ignore
        Howler.pos(listenerX, listenerY, listenerZ);

        // start new sounds / update
        const walls = MapUtils.currentEntities('wall');
        MapUtils.currentEntities('token').forEach(token => {
            var audioPath = token.getString('audioPath');
            if (audioPath && audioPath != '') {
                if (!managers.has(token.id)) {
                    managers.set(token.id, new AmbientSoundManager(token));
                }
                managers.get(token.id).update(token, listenerX, listenerY, walls);
            }
        });
    },

    stop: function () {
        // @ts-ignore
        for (const [key, manager] of managers.entries()) {
            manager.stop();
        }
    }
}
