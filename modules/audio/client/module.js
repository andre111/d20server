import { AmbientAudio } from './ambient-audio.js';
import { CanvasRenderLayerAmbientSounds } from './canvas/renderlayer/canvas-renderlayer-ambient-sounds.js';
import { SidepanelTabAudio } from './sidepanel/sidepanel-tab-audio.js';

import { Events } from '../../../core/common/events.js';

Events.on('addRenderLayers', event => {
    // use a render layer to get access to viewers and camera position
    event.addRenderLayer(new CanvasRenderLayerAmbientSounds());
});

Events.on('addSidepanelTabs', event => {
    event.addSidepanelTab(new SidepanelTabAudio());
});

Events.on('mapChange', event => {
    AmbientAudio.init();
    AmbientAudio.stop();
});
