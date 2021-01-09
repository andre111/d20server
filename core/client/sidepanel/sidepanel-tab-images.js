import { SidepanelTab } from './sidepanel-tab.js';
import { SearchableIDTree } from '../gui/searchable-id-tree.js';
import { getValueProvider } from '../gui/value-providers.js';
import { CanvasWindowUpload } from '../canvas/window/canvas-window-upload.js';
import { CanvasWindowInput } from '../canvas/window/canvas-window-input.js';
import { CanvasWindowConfirm } from '../canvas/window/canvas-window-confirm.js';
import { CanvasModeEntities } from '../canvas/mode/canvas-mode-entities.js';
import { GuiUtils } from '../util/guiutil.js';
import { ServerData } from '../server-data.js';
import { MessageService } from '../service/message-service.js';
import { Client } from '../app.js';
import { StateMain } from '../state/state-main.js';
import { EntityReference } from '../entity/entity-reference.js';

import { Entity } from '../../common/entity/entity.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { ActionCommand } from '../../common/messages.js';

export class SidepanelTabImages extends SidepanelTab {
    constructor() {
        super('Images', ServerData.isGM());
        
        this.tab.style.display = 'grid';
        this.tab.style.gridTemplateRows = 'auto max-content max-content';
        
        var treePanel = document.createElement('div');
        treePanel.style.overflow = 'auto';
        this.tab.appendChild(treePanel);
        this.tree = new SearchableIDTree(treePanel, 'sidepanel-tab-images', getValueProvider('image'));
        EntityManagers.get('image').addListener(() => this.tree.reload());
        
        var buttonPanel1 = document.createElement('div');
        this.tab.appendChild(buttonPanel1);
        GuiUtils.createButton(buttonPanel1, 'Add as Token', () => this.doAddAsToken());
        GuiUtils.createButton(buttonPanel1, 'Apply to Token', () => this.doApplyToToken());
        GuiUtils.createButton(buttonPanel1, 'Show to Players', () => this.doShowToPlayers());
        
        var buttonPanel2 = document.createElement('div');
        this.tab.appendChild(buttonPanel2);
        GuiUtils.createButton(buttonPanel2, 'Rename', () => this.doRename());
        GuiUtils.createButton(buttonPanel2, 'Upload Image', () => this.doUploadImage());
        GuiUtils.createButton(buttonPanel2, 'Remove Image', () => this.doRemoveImage());
    }
    
    doAddAsToken() {
        var id = this.tree.getSelectedValue();
        if(id) {
            if(Client.getState() instanceof StateMain && Client.getState().getMode() instanceof CanvasModeEntities && Client.getState().getMode().entityType == 'token') {
                const token = new Entity('token');
                token.prop('imageID').setLong(id);
                Client.getState().getMode().setAddEntityAction(token);
            }
        }
    }
    
    doApplyToToken() {
        const id = this.tree.getSelectedValue();
        if(id) {
            if(Client.getState() instanceof StateMain && Client.getState().getMode() instanceof CanvasModeEntities && Client.getState().getMode().entityType == 'token') {
                if(Client.getState().getMode().activeEntities.length == 1) {
                    const reference = Client.getState().getMode().activeEntities[0];
                    reference.prop('imageID').setLong(id);
                    reference.performUpdate();
                }
            }
        }
    }
    
    doShowToPlayers() {
        const id = this.tree.getSelectedValue();
        if(id) {
            const msg = new ActionCommand('SHOW_IMAGE', id);
            MessageService.send(msg);
        }
    }
    
    doRename() {
        const id = this.tree.getSelectedValue();
        if(id) {
            const reference = new EntityReference(EntityManagers.get('image').find(id));
            
            new CanvasWindowInput('Rename Image', 'Enter Image Name:', reference.getName(), name => {
                if(name) {
                    reference.prop('name').setString(name);
                    reference.performUpdate();
                }
            });
        }
    }
    
    doUploadImage() {
        new CanvasWindowUpload('Upload Image', 'image/png', '/upload/image');
    }
    
    doRemoveImage() {
        const id = this.tree.getSelectedValue();
        if(id) {
            new CanvasWindowConfirm('Confirm removal', 'Are you sure you want to remove the image: '+EntityManagers.get('image').find(id).getName()+'?', () => {
                EntityManagers.get('image').remove(id);
            });
        }
    }
}
