import { Client } from '../../../core/client/app.js';
import { MapUtils } from '../../../core/client/util/maputil.js';
import { SettingsUtils } from '../../../core/client/util/settingsutil.js';

import { IntMathUtils } from '../../../core/common/util/mathutil.js';
import { SETTING_AMBIENT_VOLUME } from './module.js';

export class AmbientSoundManager {
    constructor(token) {
        this.resetCooldown(token);
    }
    
    update(token, listenerX, listenerY) {
        // track cooldown
        this.cooldown--;
        if(this.cooldown <= 0) {
            this.resetCooldown(token);
            
            // and play new sounds
            this.stop();
            var volume = token.prop('audioVolume').getDouble() * SettingsUtils.getVolume(SETTING_AMBIENT_VOLUME);
            this.sound = new Howl({
                src: ['/data/files'+token.prop('audioPath').getString()],
                format: ['ogg'],
                volume: volume
            });
            // handle spacial settings
            this.sound.pos(token.prop('x').getLong(), token.prop('y').getLong(), 0);
            this.sound.pannerAttr({
                distanceModel: 'linear',
                refDistance : 0,
                maxDistance: MapUtils.currentMap().prop('gridSize').getLong() * token.prop('audioDistance').getDouble()
            });
            // start
            this.sound.play();
            // apply reverb (if set)
            if(token.prop('audioReverb').getBoolean()) {
                this.sound.sendToConvolver('reverb', 1.0);
                this.sound.convolverVolume(volume);
                this.sound.volume(0);
            }
        }
        
        // update wall muffling
        if(this.sound) {
            var muffle = false;
            if(token.prop('audioWallsMuffle').getBoolean()) {
                var x1 = token.prop('x').getLong();
                var y1 = token.prop('y').getLong();
                var x2 = listenerX;
                var y2 = listenerY;
                
                MapUtils.currentEntities('wall').forEach(wall => {
                    if(!wall.prop('seeThrough').getBoolean() && (!wall.prop('door').getBoolean() || !wall.prop('open').getBoolean()) && IntMathUtils.doLineSegmentsIntersect(x1, y1, x2, y2, wall.prop('x1').getLong(), wall.prop('y1').getLong(), wall.prop('x2').getLong(), wall.prop('y2').getLong())) {
                        muffle = true;
                    }
                });
            }
            // 
            if(muffle) {
                this.sound.addFilter({
                    filterType: 'lowpass',
                    frequency: 250.0,
                    Q: 3.0
                });
            } else {
                this.sound.addFilter({
                    filterType: 'lowpass',
                    frequency: 1000.0,
                    Q: 1.0
                });
            }
        }
    }
    
    resetCooldown(token) {
        var minPause = Math.max(1, token.prop('audioMinPause').getLong());
        var maxPause = Math.max(minPause, token.prop('audioMaxPause').getLong());
        var pause = minPause + IntMathUtils.getRandomInt(maxPause - minPause);
        this.cooldown = pause * Client.FPS;
    }
    
    stop() {
        if(this.sound) {
            if(this.sound.playing()) this.sound.stop();
            this.sound = null;
        }
    }
}
