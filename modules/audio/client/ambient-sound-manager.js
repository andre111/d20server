import { Client } from '../../../core/client/app.js';
import { MapUtils } from '../../../core/client/util/maputil.js';
import { SettingsUtils } from '../../../core/client/util/settingsutil.js';

import { IntMathUtils } from '../../../core/common/util/mathutil.js';
import { SETTING_AMBIENT_VOLUME } from './module.js';

export class AmbientSoundManager {
    constructor(token) {
        this.resetCooldown(token);
    }
    
    update(token, listenerX, listenerY, walls) {
        // track cooldown
        this.cooldown--;
        if(this.cooldown <= 0) {
            this.resetCooldown(token);
            
            // and play new sounds
            this.stop();
            var volume = token.getDouble('audioVolume') * SettingsUtils.getVolume(SETTING_AMBIENT_VOLUME);
            this.sound = new Howl({
                src: ['/data/files'+token.getString('audioPath')],
                format: ['ogg'],
                volume: volume
            });
            // handle spacial settings
            this.sound.pos(token.getLong('x'), token.getLong('y'), 0);
            this.sound.pannerAttr({
                distanceModel: 'linear',
                refDistance : 0,
                maxDistance: MapUtils.currentMap().getLong('gridSize') * token.getDouble('audioDistance')
            });
            // start
            this.sound.play();
            // apply reverb (if set)
            if(token.getBoolean('audioReverb')) {
                this.sound.sendToConvolver('reverb', 1.0);
                this.sound.convolverVolume(volume);
                this.sound.volume(0);
            }
        }
        
        // update wall muffling
        if(this.sound) {
            var muffle = false;
            if(token.getBoolean('audioWallsMuffle')) {
                const x1 = token.getLong('x');
                const y1 = token.getLong('y');
                const x2 = listenerX;
                const y2 = listenerY;
                
                for(const wall of walls) {
                    if(!wall.getBoolean('seeThrough') && (!wall.getBoolean('door') || !wall.getBoolean('open')) && IntMathUtils.doLineSegmentsIntersect(x1, y1, x2, y2, wall.getLong('x1'), wall.getLong('y1'), wall.getLong('x2'), wall.getLong('y2'))) {
                        muffle = true;
                        break;
                    }
                }
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
        var minPause = Math.max(1, token.getLong('audioMinPause'));
        var maxPause = Math.max(minPause, token.getLong('audioMaxPause'));
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
