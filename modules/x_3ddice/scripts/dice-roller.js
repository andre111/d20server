/**
 * Generic utilities class...
 */
class Utils {
    /**
     * Get the contrasting color for any hex color.
     *
     * @returns {String} The contrasting color (black or white)
     */
    static contrastOf(color) {

        if (color.slice(0, 1) === '#') {
            color = color.slice(1);
        }

        if (color.length === 3) {
            color = color.split('').map(function (hex) {
                return hex + hex;
            }).join('');
        }

        const r = parseInt(color.substr(0, 2), 16);
        const g = parseInt(color.substr(2, 2), 16);
        const b = parseInt(color.substr(4, 2), 16);

        var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

        return (yiq >= 128) ? '#000000' : '#FFFFFF';
    };
}

class DiceRoller {
    constructor() {
        this.isReady = false;
        this.preloaded = false;
        this.scheduledThrows = [];
        
        this._createCanvas();
        this._initialize();
    }
    
    _createCanvas() {
        this.canvas = document.createElement("div");
        this.canvas.style.position = "absolute";
        this.canvas.style.left = "0";
        this.canvas.style.top = "0";
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.canvas.style.pointerEvents = "none";
        document.body.appendChild(this.canvas);
    }
    
    _initialize() {
        new Promise(async resolve => {
            this.factory = new DiceFactory();
            await this.factory._loadFonts();
            
            var config = {
                autoscale: true,
                canBeFlipped: true, // should this be possible (knock old dice around with new dice)
                speed: 1,
                shadowQuality: 'high',
                bumpMapping: true,
                sounds: true,
                soundsSurface: 'felt',
                soundsVolume: 0.5,
                throwingForce: 'medium',
                useHighDPI: true
            };
            
            DiceColors.loadTextures(TEXTURELIST, async (images) => {
                DiceColors.initColorSets();
                
                // create main box
                this.box = new DiceBox(this.canvas, this.factory, config);
                await this.box.initialize();
                this.isReady = true;
            });
            resolve();
        });
    }
    
    _performThrow(t) {
        if(!this.isReady) return false;
        if(!this.preloaded) {
            this.box.preloadSounds();
            this.preloaded = true;
        }
        
        // cancel potential fadeout
        $(this.canvas).stop();
        $(this.canvas).show();
        
        // create throw
        return this.box.start_throw(t, () => {
            for(var tr of t) if(tr.done) tr.done();
            
            // and fadeout afterwards
            setTimeout(() => {
                if (!this.box.rolling) {
                    $(this.canvas).fadeOut({
                        duration: 1000,
                        complete: () => {
                            this.box.clearAll();
                        },
                        fail: () => {
                            $(this.canvas).fadeIn(0);
                        }
                    });
                }
            }, 2000);
        });
    }
    
    addThrows(t, schedule = true) {
        if(schedule) {
            this.scheduledThrows.push(t);
        } else {
            this._performThrow(t);
        }
    }
    
    onFrame() {
        if(!this.isReady) return;
        this.box.setDimensions();
        
        // try to start the next throw
        if(this.scheduledThrows.length > 0) {
            if(this._performThrow(this.scheduledThrows[0])) {
                this.scheduledThrows.shift();
            }
        }
        
        // update
        if(this.box.shouldUpdateOnFrame) {
            this.box.animateThrow();
        }
    }
}
