import { MusicPlayer } from '../music-player.js';

import { SidepanelTab } from '../../../../core/client/sidepanel/sidepanel-tab.js';
import { SearchableIDTree } from '../../../../core/client/gui/searchable-id-tree.js';
import { getValueProvider } from '../../../../core/client/gui/value-providers.js';
import { CanvasWindowInput } from '../../../../core/client/canvas/window/canvas-window-input.js';
import { CanvasWindowUpload } from '../../../../core/client/canvas/window/canvas-window-upload.js';
import { CanvasWindowConfirm } from '../../../../core/client/canvas/window/canvas-window-confirm.js';
import { ServerData } from '../../../../core/client/server-data.js';
import { GuiUtils } from '../../../../core/client/util/guiutil.js';
import { EntityReference } from '../../../../core/client/entity/entity-reference.js';

import { EntityManagers } from '../../../../core/common/entity/entity-managers.js';
import { Client } from '../../../../core/client/app.js';
import { StateMain } from '../../../../core/client/state/state-main.js';
import { CanvasModeEntities } from '../../../../core/client/canvas/mode/canvas-mode-entities.js';

export class SidepanelTabAudio extends SidepanelTab {
    constructor() {
        super('Audio', ServerData.isGM());
        
        this.tab.style.display = 'grid';
        this.tab.style.gridTemplateRows = 'auto max-content max-content max-content';
        
        var treePanel = document.createElement('div');
        treePanel.style.overflow = 'auto';
        this.tab.appendChild(treePanel);
        this.tree = new SearchableIDTree(treePanel, 'sidepanel-tab-audio', getValueProvider('audio'));
        EntityManagers.get('audio').addListener(() => this.tree.reload());
        
        var buttonPanel1 = document.createElement('div');
        this.tab.appendChild(buttonPanel1);
        GuiUtils.createButton(buttonPanel1, 'Apply to Token', () => this.doApplyToToken());
        GuiUtils.createButton(buttonPanel1, 'Load in Player', () => this.doLoadInPlayer());
        
        var buttonPanel2 = document.createElement('div');
        this.tab.appendChild(buttonPanel2);
        GuiUtils.createButton(buttonPanel2, 'Rename', () => this.doRename());
        GuiUtils.createButton(buttonPanel2, 'Upload Audio', () => this.doUploadAudio());
        GuiUtils.createButton(buttonPanel2, 'Remove Audio', () => this.doRemoveAudio());
        
        // create player
        var playerPanel = document.createElement('div');
        GuiUtils.makeBordered(playerPanel, 'Music Player');
        this.tab.appendChild(playerPanel);
        this.musicPlayer = new MusicPlayer(playerPanel);
    }
    
    doApplyToToken() {
        var id = this.tree.getSelectedValue();
        if(id) {
            if(Client.getState() instanceof StateMain && Client.getState().getMode() instanceof CanvasModeEntities && Client.getState().getMode().entityType == 'token') {
                if(Client.getState().getMode().activeEntities.length == 1) {
                    const reference = Client.getState().getMode().activeEntities[0];
                    reference.prop('audioID').setLong(id);
                    reference.performUpdate();
                }
            }
        }
    }
    
    doLoadInPlayer() {
        const id = this.tree.getSelectedValue();
        if(id) {
            this.musicPlayer.load(id);
        }
    }
    
    doRename() {
        const id = this.tree.getSelectedValue();
        if(id) {
            const reference = new EntityReference(EntityManagers.get('audio').find(id));
            
            new CanvasWindowInput('Rename Audio', 'Enter Audio Name:', reference.getName(), name => {
                if(name) {
                    reference.prop('name').setString(name);
                    reference.performUpdate();
                }
            });
        }
    }
    
    doUploadAudio() {
        new CanvasWindowUpload('Upload Audio', 'audio/ogg', '/upload/audio');
    }
    
    doRemoveAudio() {
        const id = this.tree.getSelectedValue();
        if(id) {
            new CanvasWindowConfirm('Confirm removal', 'Are you sure you want to remove the audio: '+EntityManagers.get('audio').find(id).getName()+'?', () => {
                EntityManagers.get('audio').remove(id);
            });
        }
    }
}
