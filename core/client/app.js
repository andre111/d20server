import { Common, Entity } from '../common/common.js';
import { Events } from '../common/events.js';
import { Access, Layer } from '../common/constants.js';
import { FILE_TYPE_IMAGE } from '../common/util/datautil.js';

import { ClientIDProvider } from './entity/id.js';
import { ClientEntityManager } from './entity/client-entity-manager.js';

import { ServerData } from './server-data.js';
import { InputService } from './service/input-service.js';
import { ImageService } from './service/image-service.js';
import { CanvasView } from './canvas/canvas-view.js';
import { ModeButton, ModeButtonExtended } from './canvas/mode-panel.js';
import { CanvasModeEntities } from './canvas/mode/canvas-mode-entities.js';
import { CanvasModeWalls, WallActionCreateWall, WallActionCreateOneSidedWall, WallActionCreateWindow, WallActionCreateDoor } from './canvas/mode/canvas-mode-walls.js';
import { CanvasRenderLayerBG } from './canvas/renderlayer/canvas-renderlayer-bg.js';
import { CanvasRenderLayerEffects } from './canvas/renderlayer/canvas-renderlayer-effects.js';
import { CanvasRenderLayerGrid } from './canvas/renderlayer/canvas-renderlayer-grid.js';
import { CanvasRenderLayerLights } from './canvas/renderlayer/canvas-renderlayer-lights.js';
import { CanvasRenderLayerTokens } from './canvas/renderlayer/canvas-renderlayer-tokens.js';
import { CanvasRenderLayerWallLines } from './canvas/renderlayer/canvas-renderlayer-walllines.js';
import { CanvasRenderLayerWallOcclusion } from './canvas/renderlayer/canvas-renderlayer-wallocclusion.js';
import { CanvasRenderLayerWeather } from './canvas/renderlayer/canvas-renderlayer-weather.js';
import { CanvasEntityRendererToken } from './canvas/entityrenderer/canvas-entityrenderer-token.js';
import { WallRenderer } from './renderer/wall-renderer.js';
import { LightRenderer } from './renderer/light-renderer.js';
import { SidepanelTabChat } from './sidepanel/sidepanel-tab-chat.js';
import { SidepanelTabPlayers } from './sidepanel/sidepanel-tab-players.js';
import { SidepanelTabActors } from './sidepanel/sidepanel-tab-actors.js';
import { SidepanelTabAttachments } from './sidepanel/sidepanel-tab-attachments.js';
import { SidepanelTabMaps } from './sidepanel/sidepanel-tab-maps.js';
import { CanvasWindowImage } from './canvas/window/canvas-window-image.js';
import { CanvasWindowChoose } from './canvas/window/canvas-window-choose.js';
import { createDefaultFileManager } from './canvas/window/canvas-window-filemanager.js';
import { FileActionCreateToken } from './canvas/window/filemanager/action/file-action-create-token.js';
import { FileActionShowToPlayers } from './canvas/window/filemanager/action/file-action-show-to-players.js';

import { StateInit } from './state/state-init.js';
import { Settings } from './settings/settings.js';
import { SettingsEntryNumberRange } from './settings/settings-entry-number-range.js';
import { CanvasWindowText } from './canvas/window/canvas-window-text.js';
import { ModuleSettings } from './settings/module-settings.js';
import { CanvasWindowEditEntity } from './canvas/window/canvas-window-edit-entity.js';
import { EntityManagers } from '../common/entity/entity-managers.js';
import { MapUtils } from './util/maputil.js';
import { EntityReference } from '../common/entity/entity-reference.js';
import { MessageService } from './service/message-service.js';
import { ActionCommand, MovePlayerToMap, SendChatMessage } from '../common/messages.js';
import { CanvasWindowFitToGrid } from './canvas/window/canvas-window-fit-to-grid.js';
import { CanvasWindowConfirm } from './canvas/window/canvas-window-confirm.js';
import { TokenUtil } from '../common/util/tokenutil.js';
import { EditorList } from './gui/editor-list.js';
import { ActorPropertyEditor } from './gui/property-editor/special/actor-property-editor.js';

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


// Mode Buttons
Events.on('addModeButtons', event => {
    // token mode
    event.data.addButton(new ModeButtonExtended(new ModeButton('/core/files/img/gui/cursor', 'Edit Tokens', () => Client.getState().getMode() instanceof CanvasModeEntities && Client.getState().getMode().entityType == 'token', () => Client.getState().setMode(new CanvasModeEntities('token'))), 0));
    
    // wall mode
    if(ServerData.isGM()) {
        event.data.addButton(new ModeButtonExtended(new ModeButton('/core/files/img/gui/wall', 'Edit Walls', () => Client.getState().getMode() instanceof CanvasModeWalls, () => Client.getState().setMode(new CanvasModeWalls())), 0, [
            new ModeButton('/core/files/img/gui/wall', 'Create Walls', () => Client.getState().getMode() instanceof CanvasModeWalls && Client.getState().getMode().action instanceof WallActionCreateWall, () => { Client.getState().setMode(new CanvasModeWalls()); Client.getState().getMode().setAction(new WallActionCreateWall(Client.getState().getMode())); }),
            new ModeButton('/core/files/img/gui/onesidedwall', 'Create One Sided Walls', () => Client.getState().getMode() instanceof CanvasModeWalls && Client.getState().getMode().action instanceof WallActionCreateOneSidedWall, () => { Client.getState().setMode(new CanvasModeWalls()); Client.getState().getMode().setAction(new WallActionCreateOneSidedWall(Client.getState().getMode())); }),
            new ModeButton('/core/files/img/gui/window', 'Create Windows', () => Client.getState().getMode() instanceof CanvasModeWalls && Client.getState().getMode().action instanceof WallActionCreateWindow, () => { Client.getState().setMode(new CanvasModeWalls()); Client.getState().getMode().setAction(new WallActionCreateWindow(Client.getState().getMode())); }),
            new ModeButton('/core/files/img/gui/door', 'Create Doors', () => Client.getState().getMode() instanceof CanvasModeWalls && Client.getState().getMode().action instanceof WallActionCreateDoor, () => { Client.getState().setMode(new CanvasModeWalls()); Client.getState().getMode().setAction(new WallActionCreateDoor(Client.getState().getMode())); })
        ]));
    }
});

Events.on('addModeButtonsGM', event => {
    // select layer
    var showLayerButtons = false;
    event.data.addButton(new ModeButtonExtended(new ModeButton('/core/files/img/gui/layers', 'Select Layer', () => showLayerButtons, () => { showLayerButtons = !showLayerButtons; }), 0, [
            new ModeButton('/core/files/img/gui/bg', 'Background Layer', () => Client.getState().getLayer() == Layer.BACKGROUND, () => { Client.getState().setLayer(Layer.BACKGROUND); showLayerButtons = false; }),
            new ModeButton('/core/files/img/gui/token', 'Token Layer', () => Client.getState().getLayer() == Layer.MAIN, () => { Client.getState().setLayer(Layer.MAIN); showLayerButtons = false; }),
            new ModeButton('/core/files/img/gui/gm', 'GM Overlay Layer', () => Client.getState().getLayer() == Layer.GMOVERLAY, () => { Client.getState().setLayer(Layer.GMOVERLAY); showLayerButtons = false; })
        ])
    );

    // select view
    event.data.addButton(new ModeButtonExtended(new ModeButton('/core/files/img/gui/viewGM', 'GM-View', () => !Client.getState().getView().isPlayerView(), () => Client.getState().setView(new CanvasView(ServerData.localProfile, false, false, false, true))), 8));
    event.data.addButton(new ModeButtonExtended(new ModeButton('/core/files/img/gui/viewPlayer', 'Player-View', () => Client.getState().getView().isPlayerView(), () => {
        new CanvasWindowChoose('profile', id => {
            if(id > 0) Client.getState().setView(new CanvasView(ServerData.profiles.get(id), true, true, true, false));
            Events.trigger('updateModeState');
        });
    }), 0));

    // files
    event.data.addButton(new ModeButtonExtended(new ModeButton('/core/files/img/gui/fileman', 'Open File Manager', () => false, () => {
        const manager = createDefaultFileManager();
        manager.registerFileAction(new FileActionCreateToken(manager));
        manager.registerFileAction(new FileActionShowToPlayers(manager));
        manager.init(file => {
            if(!file) return;
            
            Events.trigger('fileManagerSelect', {
                file: file,
                manager: manager
            }, true);
        });
    }), 8));
});


// RenderLayers + EntityRenderes + Sidepanel Tabs
Events.on('addRenderLayers', event => {
    event.data.addRenderLayer(new CanvasRenderLayerBG(-10000));
    event.data.addRenderLayer(new CanvasRenderLayerTokens(-1000, Layer.BACKGROUND, false, false));
    event.data.addRenderLayer(new CanvasRenderLayerGrid(0));
    event.data.addRenderLayer(new CanvasRenderLayerWallLines(500));
    event.data.addRenderLayer(new CanvasRenderLayerTokens(1000, Layer.MAIN, false, true));
    event.data.addRenderLayer(new CanvasRenderLayerEffects(1500, false));
    event.data.addRenderLayer(new CanvasRenderLayerWeather(1600));
    event.data.addRenderLayer(new CanvasRenderLayerWallOcclusion(1700));
    event.data.addRenderLayer(new CanvasRenderLayerLights(1800));
    event.data.addRenderLayer(new CanvasRenderLayerTokens(2000, Layer.GMOVERLAY, false, true, 0.5, true));
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

Events.on('createMainHTML', () => {
    WallRenderer.init();
    LightRenderer.init();
});


// Callbacks
Events.on('actionCommand', event => {
    if(!event.data.isGM()) return; // only accept commands from gm
    
    if(event.data.getCommand() == 'SHOW_IMAGE') {
        new CanvasWindowImage(event.data.getText());
    } else if(event.data.getCommand() == 'SHOW_TEXT') {
        new CanvasWindowText('Text', event.data.getText());
    }
});

Events.on('fileManagerSelect', event => {
    if(event.data.file.getType() == FILE_TYPE_IMAGE) {
        new CanvasWindowImage('/data/files' + event.data.file.getPath());
        event.cancel();
    }
});


// Entity Menus
//    Generic
Events.on('entityMenu', event => {
    const menu = event.data.menu;
    menu.createItem(menu.container, 'Edit', () => new CanvasWindowEditEntity(event.data.reference));
}, true, 1);

Events.on('entityMenu', event => {
    const menu = event.data.menu;
    const reference = event.data.reference;

    if(reference.prop('depth') && reference.prop('depth').canEdit(event.data.accessLevel)) {
        const move = menu.createCategory(menu.container, 'Move');
        menu.createItem(move, 'to front', () => {
            const currentMinDepth = MapUtils.currentEntitiesInLayer(reference.getType(), Client.getState().getLayer()).map(e => e.prop('depth').getLong()).reduce((a, b) => Math.min(a, b), 0);
            reference.prop('depth').setLong(currentMinDepth-1);
            reference.performUpdate();
        });
        menu.createItem(move, 'to back', () => {
            const currentMaxDepth = MapUtils.currentEntitiesInLayer(reference.getType(), Client.getState().getLayer()).map(e => e.prop('depth').getLong()).reduce((a, b) => Math.max(a, b), 0);
            reference.prop('depth').setLong(currentMaxDepth+1);
            reference.performUpdate();
        });
    }
}, true, 200);

Events.on('entityMenu', event => {
    if(!event.data.isGM) return;

    const menu = event.data.menu;
    menu.createItem(menu.container, 'Delete', () => {
        new CanvasWindowConfirm('Confirm removal', 'Are you sure you want to remove the '+event.data.entityType+': '+event.data.reference.getName()+'?', () => {
            EntityManagers.get(event.data.reference.getManager()).remove(event.data.reference.getID());
            if(menu.mode && menu.mode.clearActiveEntities) menu.mode.clearActiveEntities();
        });
    });
}, true, 1000);

//    Tokens
Events.on('entityMenu', event => {
    if(event.data.entityType !== 'token') return;

    const menu = event.data.menu;
    const reference = event.data.reference;
    const accessLevel = event.data.accessLevel;

    const actor = TokenUtil.getActor(reference);

    // edit actor
    if(actor) {
        menu.createItem(menu.container, 'Edit Actor', () => {
            const iActor = TokenUtil.getActor(reference);
            if(iActor) new CanvasWindowEditEntity(new EntityReference(iActor));
        });
    }

    // sending macros
    const sendMacro = name => MessageService.send(new SendChatMessage('!' + name));
    const addMacros = (category, names, sort = true, prefix = '') => {
        // sort macros before adding to menu
        if(sort) names.sort();
        
        if(names.length > 0) {
            const macroCategory = menu.createCategory(menu.container, category);
            const subCategories = new Map();

            for(var i=0; i<names.length; i++) {
                var name = names[i];

                // hide macros starting with _
                if(name.startsWith('_')) continue;

                // use / as a sepparator for sub categories
                var parent = macroCategory;
                if(name.includes('/')) {
                    const category = name.substring(0, name.indexOf('/'));
                    name = name.substring(name.indexOf('/')+1);

                    if(!subCategories.has(category)) subCategories.set(category, menu.createCategory(macroCategory, category));
                    parent = subCategories.get(category);
                }
                
                const fullName = names[i];
                menu.createItem(parent, name, () => sendMacro(prefix + fullName));
            }
        }
    };
    
    // actor macros
    if(actor) {
        const actorAccessLevel = actor.getAccessLevel(ServerData.localProfile);
        if(Access.matches(actor.prop('macroUse').getAccessValue(), actorAccessLevel)) {
            addMacros('Macros', Object.keys(actor.prop('macros').getStringMap()));

            addMacros('Inbuilt Macros', Object.keys(actor.getPredefinedMacros()), false, '!');
        }
    }

    // gm actions
    if(event.data.isGM) {
        menu.createItem(menu.container, 'View Notes', () => new CanvasWindowText('GM Notes', reference.prop('gmNotes').getString()));
        menu.createItem(menu.container, 'Fit to Grid', () => new CanvasWindowFitToGrid(reference));
    }
}, true, 100);

//    Walls
Events.on('entityMenu', event => {
    if(event.data.entityType !== 'wall') return;

    const menu = event.data.menu;
    const reference = event.data.reference;

    if(reference.prop('oneSided').getBoolean()) {
        menu.createItem(menu.container, 'Flip', () => {
            const x1 = reference.prop('x1').getLong();
            const y1 = reference.prop('y1').getLong();
            reference.prop('x1').setLong(reference.prop('x2').getLong());
            reference.prop('y1').setLong(reference.prop('y2').getLong());
            reference.prop('x2').setLong(x1);
            reference.prop('y2').setLong(y1);
            reference.performUpdate();
        });
    }
    
    if(reference.prop('door').getBoolean()) {
        if(reference.prop('open').getBoolean()) menu.createItem(menu.container, 'Close Door', () => { reference.prop('open').setBoolean(false); reference.performUpdate(); });
        else menu.createItem(menu.container, 'Open Door', () => { reference.prop('open').setBoolean(true); reference.performUpdate(); });
        
        if(reference.prop('locked').getBoolean()) menu.createItem(menu.container, 'Unlock Door', () => { reference.prop('locked').setBoolean(false); reference.performUpdate(); });
        else menu.createItem(menu.container, 'Lock Door', () => { reference.prop('locked').setBoolean(true); reference.performUpdate(); });
    }
}, true, 100);

//    Maps
Events.on('entityMenu', event => {
    if(event.data.entityType !== 'map') return;

    const menu = event.data.menu;
    const reference = event.data.reference;

    if(event.data.isGM || reference.prop("playersCanEnter").getBoolean()) {
        menu.createItem(menu.container, 'Open', () => MessageService.send(new MovePlayerToMap(reference, ServerData.localProfile)));
    }
    if(event.data.isGM) {
        menu.createItem(menu.container, 'Move Players', () => MessageService.send(new MovePlayerToMap(reference)));
    }
}, true, 100);

//    Actors
Events.on('entityMenu', event => {
    if(event.data.entityType !== 'actor') return;

    const menu = event.data.menu;
    const reference = event.data.reference;

    if(event.data.isGM) {
        menu.createItem(menu.container, 'Create Token', () => {
            const token = new Entity('token');
            token.prop('actorID').setLong(reference.getID());
            token.prop('imagePath').setString(reference.prop('tokenImagePath').getString());
            token.prop('width').setLong(reference.prop('tokenWidth').getLong());
            token.prop('height').setLong(reference.prop('tokenHeight').getLong());

            const event = Events.trigger('createTokenFromActor', { token: token, actor: reference }, true);
            if(!event.canceled) {
                Client.getState().setMode(new CanvasModeEntities('token'));
                Client.getState().getMode().setAddEntityAction(event.data.token);
                Events.trigger('updateModeState');
            }
        });
        menu.createItem(menu.container, 'Set Default Token', () => {
            if(Client.getState().getMode() instanceof CanvasModeEntities && Client.getState().getMode().entityType == 'token') {
                if(Client.getState().getMode().activeEntities.length == 1) {
                    const token = Client.getState().getMode().activeEntities[0].clone();

                    reference.prop('tokenImagePath').setString(token.prop('imagePath').getString());
                    reference.prop('tokenWidth').setLong(token.prop('width').getLong());
                    reference.prop('tokenHeight').setLong(token.prop('height').getLong());
                    reference.performUpdate();
                }
            }
        });
        menu.createItem(menu.container, 'Show Image', () => {
            const imagePath = reference.prop('imagePath').getString();
            if(imagePath) MessageService.send(new ActionCommand('SHOW_IMAGE', 0, 0, 0, false, '/data/files'+imagePath));
        });
    }
}, true, 100);


// Edit Windows
//TODO: replace with truly custom implementation
Events.on('editWindowCreateTabs', event => {
    if(event.data.reference.getType() != 'token') return;

    const actorEditorList = new EditorList(event.data.reference);
    event.data.window.tabs.push(actorEditorList);

    const actorTab = document.createElement('div');
    actorTab.name = 'Actor';
    const actorEditor = new ActorPropertyEditor(event.data.reference);
    actorEditorList.registerEditor(actorEditor, true);
    actorTab.appendChild(actorEditor.getContainer());
    event.data.window.content.appendChild(actorTab);
});


// Settings
export const SETTING_GLOBAL_VOLUME = new SettingsEntryNumberRange('Global Volume', 100, 0, 100);
export const SETTING_WEATHER_VOLUME = new SettingsEntryNumberRange('Weather Volume', 100, 0, 100);
export const SETTING_PAGE_GENERAL = Settings.createPage('general', 'General');
export const SETTING_PAGE_AUDIO = Settings.createPage('audio', 'Audio');
SETTING_PAGE_AUDIO.addEntry('volume', SETTING_GLOBAL_VOLUME);
SETTING_PAGE_AUDIO.addEntry('weather_volume', SETTING_WEATHER_VOLUME);
Events.on('createMainHTML', event => {
    if(ServerData.isGM()) ModuleSettings.init();
});

// initialize state
Client.setState(new StateInit());
