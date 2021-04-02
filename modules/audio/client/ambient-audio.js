import { AmbientSoundManager } from './ambient-sound-manager.js';

import { MapUtils } from '../../../core/client/util/maputil.js';

var performedInit = false;
var managers = new Map();
export const AmbientAudio = {
    init: function() {
        if(performedInit) return;
        
        // initialise reverb convolver (needs to have a howl created first to work!)
        new Howl({ src: '/modules/audio/files/ir.wav', autoplay: false });
        Howler.addConvolver('reverb', '/modules/audio/files/ir.wav'); 
        performedInit = true;
    },
    
    update: function(hasListener, listenerX, listenerY, listenerZ) {
        // update listener position
        if(!hasListener) {
            AmbientAudio.stop(); 
            return; 
        }
        Howler.pos(listenerX, listenerY, listenerZ);
        
        // start new sounds / update
        MapUtils.currentEntities('token').forEach(token => {
            var audioPath = token.prop('audioPath').getString();
            if(audioPath && audioPath != '') {
                if(!managers.has(token.id)) {
                    managers.set(token.id, new AmbientSoundManager(token));
                }
                managers.get(token.id).update(token, listenerX, listenerY);
            }
        });
    },
    
    stop: function() {
        for (const [key, manager] of managers.entries()) {
            manager.stop();
        }
    }
}
