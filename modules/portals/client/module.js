import { ModeButtonExtended } from '../../../core/client/canvas/mode-button-extended.js';
import { ModeButton } from '../../../core/client/canvas/mode-button.js';
import { Client } from '../../../core/client/client.js';
import { ServerData } from '../../../core/client/server-data.js';
import { Events } from '../../../core/common/events.js';
import { I18N } from '../../../core/common/util/i18n.js';
import { CanvasModePortals } from './canvas/mode/canvas-mode-portals.js';
import { CanvasRenderLayerPortals } from './canvas/renderlayer/canvas-renderlayer-portals.js';

Events.on('addModeButtons', event => {
    if (ServerData.isGM()) {
        event.data.addButton(new ModeButtonExtended(new ModeButton('/modules/portals/files/img/gui/portal', I18N.get('mode.portals', 'Edit Portals'), () => Client.getState().getMode() instanceof CanvasModePortals, () => Client.getState().setMode(new CanvasModePortals())), 0));
    }
});

Events.on('addRenderLayers', event => {
    event.data.addRenderLayer(new CanvasRenderLayerPortals(600));
});
