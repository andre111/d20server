import { ServerData } from '../../../core/client/server-data.js';
import { MessageService } from '../../../core/client/service/message-service.js';

import { Events } from '../../../core/common/events.js';
import { ActionCommand } from '../../../core/common/messages.js';

export class MusicPlayer {
    constructor(parent) {
        this.audio = document.createElement('audio');
        this.audio.controls = true;
        this.audio.loop = true;
        parent.appendChild(this.audio);
        
        this.currentID = -1;
        this.lastUpdate = -1;
        
        // handle updating other clients
        this.updateListener = () => this.updateState();
        Events.on('frameEnd', this.updateListener);
        this.audio.onpause = () => {
            if(ServerData.isGM()) {
                const msg = new ActionCommand('PAUSE_MUSIC');
                MessageService.send(msg);
            }
        };
        this.audio.onplay = () => {
            if(ServerData.isGM()) {
                const msg = new ActionCommand('PLAY_MUSIC', this.currentID, -1);
                MessageService.send(msg);
            }
        };
        
        // listen to commands
        this.commandListener = evt => {
            if(!evt.isGM()) return; // only accept commands from gm
            
            switch(evt.getCommand()) {
            case 'LOAD_MUSIC':
                this.serverDoLoad(evt.getID());
                break;
            case 'PLAY_MUSIC':
                this.serverDoPlay(evt.getID(), evt.getX());
                break;
            case 'PAUSE_MUSIC':
                this.serverDoPause();
                break;
            case 'STOP_MUSIC':
                this.serverDoStop();
                break;
            }
        };
        Events.on('actionCommand', this.commandListener);
    }
    
    load(id) {
        const msg = new ActionCommand('STOP_MUSIC');
        MessageService.send(msg);
        const msg2 = new ActionCommand('LOAD_MUSIC', id);
        MessageService.send(msg2);
    }
    
    updateState() {
        // calculate time
        var now = Date.now();
        var elapsed = now - this.lastUpdate;
        
        // update when at correct time
        if(elapsed > 1000) {
            this.lastUpdate = now - (elapsed % 1000);
            
            if(ServerData.isGM()) {
                if(!this.audio.paused) {
                    const time = Math.trunc(this.audio.currentTime * 44100);
                    const msg = new ActionCommand('PLAY_MUSIC', this.currentID, time);
                    MessageService.send(msg);
                }
            }
        }
    }
    
    serverDoLoad(id) {
        if(this.currentID == id) return;
        this.currentID = id;
        this.audio.src = '/audio/'+id;
    }
    
    serverDoPlay(id, time) {
        this.serverDoLoad(id);
        if(this.audio.paused) this.audio.play();
        
        if(time < 0) return;
        var targetTime = time / 44100;
        if(Math.abs(this.audio.currentTime - targetTime) > 1) {
            this.audio.currentTime = targetTime;
        }
    }
    
    serverDoPause() {
        this.audio.pause();
    }
    
    serverDoStop() {
        this.audio.pause();
    }
}
