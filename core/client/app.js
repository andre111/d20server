import { Common } from '../common/common.js';
import { Events } from '../common/events.js';
import { Layer } from '../common/constants.js';

import { ClientIDProvider } from './entity/id.js';
import { ClientEntityManager } from './entity/client-entity-manager.js';

import { InputService } from './service/input-service.js';
import { ImageService } from './service/image-service.js';
import { ServerData } from './server-data.js';
import { ModeButton, ModeButtonExtended } from './canvas/mode-panel.js';
import { CanvasModeEntities } from './canvas/mode/canvas-mode-entities.js';
import { CanvasModeWalls, WallActionCreateWall, WallActionCreateWindow, WallActionCreateDoor } from './canvas/mode/canvas-mode-walls.js';
import { CanvasRenderLayerEffects } from './canvas/renderlayer/canvas-renderlayer-effects.js';
import { CanvasRenderLayerGrid } from './canvas/renderlayer/canvas-renderlayer-grid.js';
import { CanvasRenderLayerLights } from './canvas/renderlayer/canvas-renderlayer-lights.js';
import { CanvasRenderLayerTokens } from './canvas/renderlayer/canvas-renderlayer-tokens.js';
import { CanvasRenderLayerWallLines } from './canvas/renderlayer/canvas-renderlayer-walllines.js';
import { CanvasRenderLayerWallOcclusion } from './canvas/renderlayer/canvas-renderlayer-wallocclusion.js';
import { CanvasRenderLayerWeather } from './canvas/renderlayer/canvas-renderlayer-weather.js';
import { CanvasEntityRendererToken } from './canvas/entityrenderer/canvas-entityrenderer-token.js';
import { SidepanelTabChat } from './sidepanel/sidepanel-tab-chat.js';
import { SidepanelTabPlayers } from './sidepanel/sidepanel-tab-players.js';
import { SidepanelTabActors } from './sidepanel/sidepanel-tab-actors.js';
import { SidepanelTabAttachments } from './sidepanel/sidepanel-tab-attachments.js';
import { SidepanelTabMaps } from './sidepanel/sidepanel-tab-maps.js';
import { CanvasWindowImage } from './canvas/window/canvas-window-image.js';

import { StateInit } from './state/state-init.js';
import { StateMain } from './state/state-main.js';
import { Settings } from './settings/settings.js';
import { SettingsEntryNumberRange } from './settings/settings-entry-number-range.js';
import { FILE_TYPE_IMAGE } from '../common/util/datautil.js';

// Initialize common code
Common.init(new ClientIDProvider(), ClientEntityManager);

// apply "catching" contextmenu listener to body
document.body.oncontextmenu = () => false;

// Export public 'interface'
var _state = null;
export const Client = {
    VERSION: 10,
    FPS: 30,

    getState: function() {
        return _state;
    },

    setState: function(state) {
        if(_state) _state.exit();
        _state = state;
        state.init();
    }
}

// register some default stuff
InputService.registerAction('move_left', 37 /*LEFT*/, false, false, false);
InputService.registerAction('move_right', 39 /*RIGHT*/, false, false, false);
InputService.registerAction('move_up', 38 /*UP*/, false, false, false);
InputService.registerAction('move_down', 40 /*DOWN*/, false, false, false);

InputService.registerAction('rotate_left', 37 /*LEFT*/, true, false, false);
InputService.registerAction('rotate_right', 39 /*RIGHT*/, true, false, false);

InputService.registerAction('center_camera', 67 /*C*/, false, false, false);
InputService.registerAction('set_view', 86 /*V*/, false, false, false);
InputService.registerAction('ping_location', 80 /*P*/, false, false, false);
InputService.registerAction('ping_location_focus', 80 /*P*/, true, false, false);

InputService.registerAction('toggle_mode_window', 77 /*M*/, false, false, false);
InputService.registerAction('toggle_sidepane', 84 /*T*/, false, false, false);

InputService.registerAction('copy', 67 /*C*/, false, true, false);
InputService.registerAction('paste', 86 /*V*/, false, true, false);
InputService.registerAction('delete', 46 /*DELETE*/, false, false, false);

ImageService.init();

Events.on('addModeButtons', event => {
    // token mode
    event.data.addButton(new ModeButtonExtended(new ModeButton('/core/files/img/gui/cursor', 'Edit Tokens', () => Client.getState() instanceof StateMain && Client.getState().getMode() instanceof CanvasModeEntities && Client.getState().getMode().entityType == 'token', () => event.data.panel.setMode(new CanvasModeEntities('token', event.data.panel.currentLayer))), 0));
    
    // wall mode
    if(ServerData.isGM()) {
        event.data.addButton(new ModeButtonExtended(new ModeButton('/core/files/img/gui/wall', 'Edit Walls', () => Client.getState() instanceof StateMain && Client.getState().getMode() instanceof CanvasModeWalls, () => event.data.panel.setMode(new CanvasModeWalls())), 0, [
            new ModeButton('/core/files/img/gui/wall', 'Create Walls', () => Client.getState() instanceof StateMain && Client.getState().getMode() instanceof CanvasModeWalls && Client.getState().getMode().action instanceof WallActionCreateWall, () => { event.data.panel.setMode(new CanvasModeWalls()); Client.getState().getMode().setAction(new WallActionCreateWall(Client.getState().getMode())); event.data.panel.updateState(); }),
            new ModeButton('/core/files/img/gui/window', 'Create Windows', () => Client.getState() instanceof StateMain && Client.getState().getMode() instanceof CanvasModeWalls && Client.getState().getMode().action instanceof WallActionCreateWindow, () => { event.data.panel.setMode(new CanvasModeWalls()); Client.getState().getMode().setAction(new WallActionCreateWindow(Client.getState().getMode())); event.data.panel.updateState(); }),
            new ModeButton('/core/files/img/gui/door', 'Create Doors', () => Client.getState() instanceof StateMain && Client.getState().getMode() instanceof CanvasModeWalls && Client.getState().getMode().action instanceof WallActionCreateDoor, () => { event.data.panel.setMode(new CanvasModeWalls()); Client.getState().getMode().setAction(new WallActionCreateDoor(Client.getState().getMode())); event.data.panel.updateState(); })
        ]));
    }
});

Events.on('addRenderLayers', event => {
    event.data.addRenderLayer(new CanvasRenderLayerTokens(-1000, Layer.BACKGROUND, false));
    event.data.addRenderLayer(new CanvasRenderLayerGrid(0));
    event.data.addRenderLayer(new CanvasRenderLayerTokens(1000, Layer.MAIN, false));
    event.data.addRenderLayer(new CanvasRenderLayerEffects(1500, false));
    event.data.addRenderLayer(new CanvasRenderLayerWeather(1600));
    event.data.addRenderLayer(new CanvasRenderLayerWallOcclusion(1700));
    event.data.addRenderLayer(new CanvasRenderLayerLights(1800));
    event.data.addRenderLayer(new CanvasRenderLayerTokens(2000, Layer.GMOVERLAY, false, 0.5, true));
    event.data.addRenderLayer(new CanvasRenderLayerWallLines(2500));
    event.data.addRenderLayer(new CanvasRenderLayerEffects(2600, true));
});

Events.on('addEntityRenderers', event => {
    event.data.addEntityRenderer('token', new CanvasEntityRendererToken());
});

Events.on('addSidepanelTabs', event => {
    event.data.addSidepanelTab(new SidepanelTabChat());
    event.data.addSidepanelTab(new SidepanelTabPlayers());
    event.data.addSidepanelTab(new SidepanelTabActors());
    event.data.addSidepanelTab(new SidepanelTabAttachments());
    event.data.addSidepanelTab(new SidepanelTabMaps());
});

Events.on('actionCommand', event => {
    if(!event.data.isGM()) return; // only accept commands from gm
    
    if(event.data.getCommand() == 'SHOW_IMAGE') {
        new CanvasWindowImage(event.data.getText());
    }
});

Events.on('fileManagerSelect', event => {
    if(event.data.file.getType() == FILE_TYPE_IMAGE) {
        new CanvasWindowImage('/data/files' + event.data.file.getPath());
        event.cancel();
    }
});

export const SETTING_GLOBAL_VOLUME = new SettingsEntryNumberRange('Global Volume', 100, 0, 100);
export const SETTING_WEATHER_VOLUME = new SettingsEntryNumberRange('Weather Volume', 100, 0, 100);
export const SETTING_PAGE_GENERAL = Settings.createPage('general', 'General');
export const SETTING_PAGE_AUDIO = Settings.createPage('audio', 'Audio');
SETTING_PAGE_AUDIO.addEntry('volume', SETTING_GLOBAL_VOLUME);
SETTING_PAGE_AUDIO.addEntry('weather_volume', SETTING_WEATHER_VOLUME);

// initialize state
Client.setState(new StateInit());
