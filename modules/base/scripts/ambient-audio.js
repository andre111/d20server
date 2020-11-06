class AmbientSoundManager {
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
            var volume = token.prop("audioVolume").getDouble();
            this.sound = new Howl({
                src: ['/audio/'+token.prop("audioID").getLong()],
                format: ['ogg'],
                volume: volume
            });
            // handle spacial settings
            this.sound.pos(token.prop("x").getLong(), token.prop("y").getLong(), 0);
            this.sound.pannerAttr({
                distanceModel: 'linear',
                refDistance : 0,
                maxDistance: MapUtils.currentMap().prop("gridSize").getLong() * token.prop("audioDistance").getDouble()
            });
            // start
            this.sound.play();
            // apply reverb (if set)
            if(token.prop("audioReverb").getBoolean()) {
                this.sound.sendToConvolver("reverb", 1.0);
                this.sound.convolverVolume(volume);
                this.sound.volume(0);
            }
        }
        
        // update wall muffling
        if(this.sound) {
            var muffle = false;
            if(token.prop("audioWallsMuffle").getBoolean()) {
                var x1 = token.prop("x").getLong();
                var y1 = token.prop("y").getLong();
                var x2 = listenerX;
                var y2 = listenerY;
                
                MapUtils.currentEntities("wall").forEach(wall => {
                    if(!wall.prop("seeThrough").getBoolean() && IntMathUtils.doLineSegmentsIntersect(x1, y1, x2, y2, wall.prop("x1").getLong(), wall.prop("y1").getLong(), wall.prop("x2").getLong(), wall.prop("y2").getLong())) {
                        muffle = true;
                    }
                }).value();
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
        var minPause = Math.max(1, token.prop("audioMinPause").getLong());
        var maxPause = Math.max(minPause, token.prop("audioMaxPause").getLong());
        var pause = minPause + IntMathUtils.getRandomInt(maxPause - minPause);
        this.cooldown = pause * _g.FPS;
    }
    
    stop() {
        if(this.sound) {
            if(this.sound.playing()) this.sound.stop();
            this.sound = null;
        }
    }
}

AmbientAudio = {
    // 
    managers: new Map(),
    performedInit: false,
    
    init: function() {
        if(AmbientAudio.performedInit) return;
        
        // initialise reverb convolver (needs to have a howl created first to work!)
        new Howl({ src: "/public/audio/ir.wav", autoplay: false });
        Howler.addConvolver("reverb", "/public/audio/ir.wav"); 
        AmbientAudio.performedInit = true;
    },
    
    update: function(hasListener, listenerX, listenerY, listenerZ) {
        // update listener position
        if(!hasListener) {
            AmbientAudio.stop(); 
            return; 
        }
        Howler.pos(listenerX, listenerY, listenerZ);
        
        // start new sounds / update
        MapUtils.currentEntities("token").forEach(token => {
            var audioID = token.prop("audioID").getLong();
            if(audioID > 0) {
                if(!AmbientAudio.managers.has(token.id)) {
                    AmbientAudio.managers.set(token.id, new AmbientSoundManager(token));
                }
                AmbientAudio.managers.get(token.id).update(token, listenerX, listenerY);
            }
        }).value();
    },
    
    stop: function() {
        for (const [key, manager] of AmbientAudio.managers.entries()) {
            manager.stop();
        }
    }
}

Events.on("addRenderLayers", event => {
    // use a render layer to get access to viewers and camera position
    event.addRenderLayer(new CanvasRenderLayerAmbientSounds());
});

Events.on("mapChange", () => {
    AmbientAudio.init();
    AmbientAudio.stop()
});

//TODO: move all the audio system stuff into its own module (so this ambient stuff + the audio properties + editor + sidepanel + music player)
// (ideally also requires server side module based changes (for audio upload and action command rules))
