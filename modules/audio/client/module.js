import { AmbientAudio } from './ambient-audio.js';
import { CanvasRenderLayerAmbientSounds } from './canvas/renderlayer/canvas-renderlayer-ambient-sounds.js';
import { getMusicPlayer } from './music-player.js';

import { ModeButton, ModeButtonExtended } from '../../../core/client/canvas/mode-panel.js';

import { Events } from '../../../core/common/events.js';
import { SETTING_PAGE_AUDIO } from '../../../core/client/app.js';
import { SettingsEntryNumberRange } from '../../../core/client/settings/settings-entry-number-range.js';
import { FILE_TYPE_AUDIO } from '../../../core/common/util/datautil.js';

// ambient audio
Events.on('addRenderLayers', event => {
    // use a render layer to get access to viewers and camera position
    event.data.addRenderLayer(new CanvasRenderLayerAmbientSounds());
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
    event.data.addButton(new ModeButtonExtended(new ModeButton('/modules/audio/files/img/gui/player', 'Open Music Player', () => false, () => getMusicPlayer().show()), 0));
});

Events.on('fileManagerSelect', event => {
    if(event.data.file.getType() == FILE_TYPE_AUDIO) {
        getMusicPlayer().load('/data/files' + event.data.file.getPath());
        event.data.manager.close();
        event.cancel();
    }
});


export const SETTING_AMBIENT_VOLUME = new SettingsEntryNumberRange('Ambient Volume', 100, 0, 100);
export const SETTING_MUSIC_VOLUME = new SettingsEntryNumberRange('Music Volume', 25, 0, 100);
SETTING_PAGE_AUDIO.addEntry('ambient_volume', SETTING_AMBIENT_VOLUME);
SETTING_PAGE_AUDIO.addEntry('music_volume', SETTING_MUSIC_VOLUME);
