import { CanvasWindow } from '../../../core/client/canvas/canvas-window.js';
import { ServerData } from '../../../core/client/server-data.js';
import { MessageService } from '../../../core/client/service/message-service.js';

import { Events } from '../../../core/common/events.js';
import { ActionCommand } from '../../../core/common/messages.js';

class MusicPlayerWindow extends CanvasWindow {
    constructor(player) {
        super('Music Player', false);

        this.player = player;
        this.frame.appendChild(this.player.audio);
        this.setDimensions(340, 150);
        this.storeAndRestoreLocation('music_player_window');
    }

    onClose() {
        this.player.audio.pause(); // pause audio to prevent issues
        super.onClose();
    }
}

var _player = null;
export function getMusicPlayer() {
    if(!_player) {
        _player = new MusicPlayer();
    }
    return _player;
}

export class MusicPlayer {
    constructor() {
        this.audio = document.createElement('audio');
        this.audio.controls = true;
        this.audio.loop = true;
        this.window = null;
        
        this.currentPath = '';
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
                const msg = new ActionCommand('PLAY_MUSIC', -1, -1, -1, false, this.currentPath);
                MessageService.send(msg);
            }
        };
        
        // listen to commands
        this.commandListener = evt => {
            if(!evt.isGM()) return; // only accept commands from gm
            
            switch(evt.getCommand()) {
            case 'LOAD_MUSIC':
                this.serverDoLoad(evt.getText());
                break;
            case 'PLAY_MUSIC':
                this.serverDoPlay(evt.getText(), evt.getX());
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

    show() {
        // show window
        if(!this.window || this.window.closed) {
            this.window = new MusicPlayerWindow(this);
        }
    }
    
    load(path) {
        this.show();

        // load
        const msg = new ActionCommand('STOP_MUSIC');
        MessageService.send(msg);
        const msg2 = new ActionCommand('LOAD_MUSIC', -1, -1, -1, false, path);
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
                    const msg = new ActionCommand('PLAY_MUSIC', -1, time, -1, false, this.currentPath);
                    MessageService.send(msg);
                }
            }
        }
    }
    
    serverDoLoad(path) {
        if(this.currentPath == path) return;
        this.currentPath = path;
        this.audio.src = path;
    }
    
    serverDoPlay(path, time) {
        this.serverDoLoad(path);
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
