import { AmbientAudio } from './ambient-audio.js';
import { CanvasRenderLayerAmbientSounds } from './canvas/renderlayer/canvas-renderlayer-ambient-sounds.js';
import { getMusicPlayer } from './music-player.js';
import './settings.js';

import { ModeButton, ModeButtonExtended } from '../../../core/client/canvas/mode-panel.js';

import { Events } from '../../../core/common/events.js';
import { FILE_TYPE_AUDIO } from '../../../core/common/util/datautil.js';
import { I18N } from '../../../core/common/util/i18n.js';

// token editing
Events.on('editTokenWindowCreateTabs', event => {
    const tab = document.createElement('div');
    tab.name = I18N.get('token.edit.tabs.audio', 'Audio');
    tab.className = 'edit-window-area edit-window-full-area edit-window-grid';
    event.data.tabs.appendChild(tab);

    
    tab.appendChild(document.createTextNode(I18N.get('token.edit.audio.path', 'File:')));
    tab.appendChild(event.data.w.createFileEditor('audioPath', 'audio'));

    tab.appendChild(document.createTextNode(I18N.get('token.edit.audio.volume', 'Volume:')));
    tab.appendChild(event.data.w.createDoubleEditor('audioVolume'));
    tab.appendChild(document.createTextNode(I18N.get('token.edit.audio.distance', 'Distance (in cells):')));
    tab.appendChild(event.data.w.createDoubleEditor('audioDistance'));
    tab.appendChild(document.createTextNode(I18N.get('token.edit.audio.wallsmuffle', 'Muffled by walls:')));
    tab.appendChild(event.data.w.createBooleanEditor('audioWallsMuffle'));
    tab.appendChild(document.createTextNode(I18N.get('token.edit.audio.reverb', 'Reverb:')));
    tab.appendChild(event.data.w.createBooleanEditor('audioReverb'));
    tab.appendChild(document.createTextNode(I18N.get('token.edit.audio.minpause', 'Minimum Pause (in Seconds):')));
    tab.appendChild(event.data.w.createLongEditor('audioMinPause'));
    tab.appendChild(document.createTextNode(I18N.get('token.edit.audio.maxpause', 'Maximum Pause (in Seconds):')));
    tab.appendChild(event.data.w.createLongEditor('audioMaxPause'));
});

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
Events.on('enterMainState', event => {
    getMusicPlayer(); // force load of music player
});

Events.on('addModeButtonsGM', event => {
    event.data.addButton(new ModeButtonExtended(new ModeButton('/modules/audio/files/img/gui/player', I18N.get('modules.audio.openplayer', 'Open Music Player'), () => false, () => getMusicPlayer().show()), 0));
});

Events.on('fileManagerSelect', event => {
    if(event.data.file.getType() == FILE_TYPE_AUDIO) {
        getMusicPlayer().load('/data/files' + event.data.file.getPath());
        event.data.manager.close();
        event.cancel();
    }
});
