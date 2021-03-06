// @ts-check
import { SETTING_MUSIC_VOLUME } from './settings.js';

import { CanvasWindow } from '../../../core/client/canvas/canvas-window.js';
import { ServerData } from '../../../core/client/server-data.js';
import { MessageService } from '../../../core/client/service/message-service.js';

import { Events } from '../../../core/common/events.js';
import { ActionCommand } from '../../../core/common/messages.js';
import { Settings } from '../../../core/client/settings/settings.js';
import { I18N } from '../../../core/common/util/i18n.js';

class MusicPlayerWindow extends CanvasWindow {
    constructor(player) {
        super(null, I18N.get('modules.audio.player', 'Music Player'), false);

        this.player = player;
        this.content.appendChild(this.player.audio);
        this.setDimensions(310, 90);
        this.storeAndRestoreLocation('music_player_window');
    }

    onClose() {
        this.player.audio.pause(); // pause audio to prevent issues
        super.onClose();
    }
}

var _player = null;
export function getMusicPlayer() {
    if (!_player) {
        _player = new MusicPlayer();
    }
    return _player;
}

export class MusicPlayer {
    constructor() {
        this.audio = document.createElement('audio');
        this.audio.controls = ServerData.isGM();
        this.audio.loop = true;
        this.audio.volume = Settings.getVolume(SETTING_MUSIC_VOLUME);
        this.window = null;

        this.currentPath = '';
        this.lastUpdate = -1;
        this.lastUpdateProfileID = -1;

        // listen to setting changes
        Settings.addVolumeSettingListener(SETTING_MUSIC_VOLUME, () => {
            this.audio.volume = Settings.getVolume(SETTING_MUSIC_VOLUME);
        });
        //TODO: this currently overrides manual volume changing -> to remove this I need to build my own audio player controls (without volume slider)
        this.audio.onvolumechange = () => {
            if (this.audio.volume != Settings.getVolume(SETTING_MUSIC_VOLUME)) {
                this.audio.volume = Settings.getVolume(SETTING_MUSIC_VOLUME);
            }
        }

        // handle updating other clients
        this.updateListener = Events.on('frameEnd', event => this.updateState());
        this.audio.onpause = () => {
            if (this.lastUpdateProfileID == ServerData.localProfile.getID()) {
                const msg = new ActionCommand('PAUSE_MUSIC');
                MessageService.send(msg);
            }
        };
        this.audio.onplay = () => {
            if (this.lastUpdateProfileID == ServerData.localProfile.getID()) {
                const msg = new ActionCommand('PLAY_MUSIC', -1, -1, -1, false, this.currentPath);
                MessageService.send(msg);
            }
        };

        // listen to commands
        this.commandListener = Events.on('actionCommand', event => {
            if (!event.data.isGM()) return; // only accept commands from gm
            if (event.data.getSender() == ServerData.localProfile.getID()) return; // do not listen to events send from yourself (avoid feedback loops)

            switch (event.data.getCommand()) {
                case 'LOAD_MUSIC':
                    this.lastUpdateProfileID = event.data.getSender();
                    this.serverDoLoad(event.data.getText());
                    break;
                case 'PLAY_MUSIC':
                    this.serverDoPlay(event.data.getText(), event.data.getX());
                    break;
                case 'PAUSE_MUSIC':
                    this.serverDoPause();
                    break;
                case 'STOP_MUSIC':
                    this.serverDoStop();
                    break;
            }
        });
    }

    show() {
        // show window
        if (!this.window || this.window.closed) {
            this.window = new MusicPlayerWindow(this);
        }
    }

    load(path) {
        this.show();

        // load
        this.lastUpdateProfileID = ServerData.localProfile.getID();
        this.audio.pause();
        this.serverDoLoad(path);

        // transmit to others
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
        if (elapsed > 1000) {
            this.lastUpdate = now - (elapsed % 1000);

            if (this.lastUpdateProfileID == ServerData.localProfile.getID()) {
                if (!this.audio.paused) {
                    const time = Math.trunc(this.audio.currentTime * 44100);
                    const msg = new ActionCommand('PLAY_MUSIC', -1, time, -1, false, this.currentPath);
                    MessageService.send(msg);
                }
            }
        }
    }

    serverDoLoad(path) {
        if (this.currentPath == path) return;
        this.currentPath = path;
        this.audio.src = path;
    }

    serverDoPlay(path, time, volume) {
        this.serverDoLoad(path);
        if (this.audio.paused) this.audio.play();

        // set time
        if (time < 0) return;
        var targetTime = time / 44100;
        if (Math.abs(this.audio.currentTime - targetTime) > 1) {
            this.audio.currentTime = targetTime;
        }

        // set volume
        if (volume >= 0) {
            this.audio.volume = volume;
        }
    }

    serverDoPause() {
        this.audio.pause();
    }

    serverDoStop() {
        this.audio.pause();
    }
}
