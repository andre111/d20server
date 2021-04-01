import { ModeButton } from './mode-button.js';
import { ModeButtonExtended } from './mode-button-extended.js';
import { ServerData } from '../server-data.js';
import { Client } from '../app.js';
import { StateMain } from '../state/state-main.js';
import { CanvasWindowChoose } from '../canvas/window/canvas-window-choose.js';
import { CanvasView } from '../canvas/canvas-view.js';
import { createDefaultFileManager } from './window/canvas-window-filemanager.js';
import { FileActionCreateToken } from './window/filemanager/action/file-action-create-token.js';
import { FileActionShowToPlayers } from './window/filemanager/action/file-action-show-to-players.js';
import { Settings } from '../settings/settings.js';

import { Layer } from '../../common/constants.js';
import { Events } from '../../common/events.js';

export { ModeButton } from './mode-button.js';
export { ModeButtonExtended } from './mode-button-extended.js';
export class ModePanel {
    constructor() {
        this.currentLayer = Layer.MAIN;
        this.showLayerButtons = false;
        
        // create buttons
        this.buttons = [];
        const data = {
            panel: this,
            addButton: button => { 
                if(!(button instanceof ModeButtonExtended)) throw new Error('Invalid parameters, can only add ModeButtonExtended objects!');
                this.buttons.push(button); 
            }
        };
        Events.trigger('addModeButtons', data);
        
        // add core buttons
        if(ServerData.isGM()) {
            // select layer
            this.buttons.push(new ModeButtonExtended(new ModeButton('/core/files/img/gui/layers', 'Select Layer', () => this.showLayerButtons, () => { this.showLayerButtons = !this.showLayerButtons; this.updateState(); }), 0, [
                    new ModeButton('/core/files/img/gui/bg', 'Background Layer', () => this.currentLayer == Layer.BACKGROUND, () => this.setLayer(Layer.BACKGROUND)),
                    new ModeButton('/core/files/img/gui/token', 'Token Layer', () => this.currentLayer == Layer.MAIN, () => this.setLayer(Layer.MAIN)),
                    new ModeButton('/core/files/img/gui/gm', 'GM Overlay Layer', () => this.currentLayer == Layer.GMOVERLAY, () => this.setLayer(Layer.GMOVERLAY))
                ])
            );
            
            // select view
            this.buttons.push(new ModeButtonExtended(new ModeButton('/core/files/img/gui/viewGM', 'GM-View', () => Client.getState() instanceof StateMain && !Client.getState().getView().isPlayerView(), () => this.setView(true)), 8));
            this.buttons.push(new ModeButtonExtended(new ModeButton('/core/files/img/gui/viewPlayer', 'Player-View', () => Client.getState() instanceof StateMain && Client.getState().getView().isPlayerView(), () => this.setView(false)), 0));
        
            // files
            this.buttons.push(new ModeButtonExtended(new ModeButton('/core/files/img/gui/fileman', 'Open File Manager', () => false, () => this.openFileManager()), 8));
            Events.trigger('addModeButtonsGM', data);
        }

        // settings
        this.buttons.push(new ModeButtonExtended(new ModeButton('/core/files/img/gui/settings', 'Open Settings', () => false, () => Settings.openWindow()), 8));
        
        // init html elements
        this.container = document.createElement('div');
        this.container.className = 'mode-panel';
        document.body.appendChild(this.container);
        for(const button of this.buttons) {
            this.container.appendChild(button.container);
        }
        this.updateState();
        
        // add callback
        Events.on('mapChange', event => this.updateState());
    }
    
    updateState() {
        // check for invalid modes and switch out
        Events.trigger('updateModeState', {
            panel: this
        });
        
        // update buttons
        for(const button of this.buttons) {
            button.updateState();
        }
    }
    
    setMode(mode) {
        if(!(Client.getState() instanceof StateMain)) return;

        Client.getState().setMode(mode);
        this.updateState();
    }
    
    setLayer(layer) {
        if(!(Client.getState() instanceof StateMain)) return;

        this.currentLayer = layer;
        this.showLayerButtons = false;
        Client.getState().getMode().setLayer(layer);
        this.updateState();
    }
    
    setView(asGM) {
        if(!(Client.getState() instanceof StateMain)) return;

        if(asGM) {
            Client.getState().setView(new CanvasView(ServerData.localProfile, false, false, false, true));
            this.updateState();
        } else {
            new CanvasWindowChoose('profile', id => {
                if(id > 0) {
                    Client.getState().setView(new CanvasView(ServerData.profiles.get(id), true, true, true, false));
                    this.updateState();
                }
            });
        }
    }

    openFileManager() {
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
    }
}
