import { AmbientAudio } from './ambient-audio.js';
import { CanvasRenderLayerAmbientSounds } from './canvas/renderlayer/canvas-renderlayer-ambient-sounds.js';
import { getMusicPlayer } from './music-player.js';

import { ModeButton, ModeButtonExtended } from '../../../core/client/canvas/mode-panel.js';

import { Events } from '../../../core/common/events.js';

// ambient audio
Events.on('addRenderLayers', event => {
    // use a render layer to get access to viewers and camera position
    event.addRenderLayer(new CanvasRenderLayerAmbientSounds());
});

Events.on('mapChange', event => {
    AmbientAudio.init();
    AmbientAudio.stop();
});

// music player
Events.on('createMainHTML', event => {
    getMusicPlayer(); // force load of music player
});

Events.on('addModeButtonsGM', event => {
    event.addButton(new ModeButtonExtended(new ModeButton('/modules/audio/files/img/gui/player', 'Open Music Player', () => false, () => getMusicPlayer().show()), 0));
});

Events.on('fileManagerSelect', event => {
    if(event.canceled) return;

    if(event.file.getType() == 'audio') {
        getMusicPlayer().load('/data/files' + event.file.getPath());
        event.manager.close();
        event.canceled = true;
    }
});
