import { Client } from '../../../core/client/client.js';
import { DiceBox } from './dice-box.js';
import { DiceColors } from './dice-colors.js';
import { DiceFactory } from './dice-factory.js';

const DICE_LIMIT = 50; //TODO: configurable somewhere?

export class DiceRoller {
    #opacity;
    #fadeOut;

    constructor() {
        this.isReady = false;
        this.preloaded = false;
        this.scheduledThrows = [];
        
        this._createCanvas();
        this._initialize();
    }
    
    _createCanvas() {
        this.canvas = document.createElement('div');
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = '0';
        this.canvas.style.top = '0';
        this.canvas.style.width = 'calc(100% - 384px)';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '100000';
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
                sounds: true,
                soundsSurface: 'felt',
                soundsVolume: 0.5,
                throwingForce: 'medium',
                useHighDPI: true
            };
            
            DiceColors.loadTextures(async () => {
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

        // check dice limit
        var dice = 0;
        for(var tr of t) {
            dice += tr.dice.length
        }
        if(dice > DICE_LIMIT) {
            console.log(`Skipping 3d dice roll because of large dice count: ${dice}`);
            for(var tr of t) if(tr.done) tr.done();
            return true;
        }
        
        // cancel potential fadeout
        this.#fadeOut = false;
        this.#opacity = 1;
        this.canvas.style.display = null;
        this.canvas.style.opacity = null;
        
        // create throw 
        return this.box.start_throw(t, () => {
            for(var tr of t) if(tr.done) tr.done();
            
            // and fadeout afterwards
            setTimeout(() => {
                if (!this.box.rolling) {
                    this.#fadeOut = true;
                    this.#opacity = 1;
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

        // fadeout
        if(this.#fadeOut && this.#opacity > 0) {
            this.#opacity -= 1 / Client.FPS;
            if(this.#opacity <= 0) {
                this.#opacity = 0;
                this.canvas.style.display = 'none';
                this.canvas.style.opacity = null;
                this.box.clearAll();
            } else {
                this.canvas.style.opacity = this.#opacity+'';
            }
        }
    }
}
