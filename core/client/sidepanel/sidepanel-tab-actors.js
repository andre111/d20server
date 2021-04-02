import { SidepanelTab } from './sidepanel-tab.js';
import { SearchableIDTree } from '../gui/searchable-id-tree.js';
import { getValueProvider } from '../gui/value-providers.js';
import { CanvasWindowEditEntity } from '../canvas/window/canvas-window-edit-entity.js';
import { CanvasWindowInput } from '../canvas/window/canvas-window-input.js';
import { CanvasWindowConfirm } from '../canvas/window/canvas-window-confirm.js';
import { CanvasModeEntities } from '../canvas/mode/canvas-mode-entities.js';
import { GuiUtils } from '../util/guiutil.js';
import { ServerData } from '../server-data.js';
import { MessageService } from '../service/message-service.js';
import { Client } from '../app.js';
import { StateMain } from '../state/state-main.js';

import { Entity } from '../../common/entity/entity.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { EntityReference } from '../../common/entity/entity-reference.js';
import { ActionCommand } from '../../common/messages.js';

export class SidepanelTabActors extends SidepanelTab {
    constructor() {
        super('Actors', true);
        
        this.tab.style.display = 'grid';
        this.tab.style.gridTemplateRows = 'auto max-content max-content';
        
        var treePanel = document.createElement('div');
        treePanel.style.overflow = 'auto';
        this.tab.appendChild(treePanel);
        this.tree = new SearchableIDTree(treePanel, 'sidepanel-tab-actors', getValueProvider('actor'), () => this.doOpen());
        EntityManagers.get('actor').addListener(() => this.tree.reload());
        
        var buttonPanel1 = document.createElement('div');
        this.tab.appendChild(buttonPanel1);
        GuiUtils.createButton(buttonPanel1, 'Open', () => this.doOpen());
        if(ServerData.isGM()) {
            GuiUtils.createButton(buttonPanel1, 'Add Actor', () => this.doAdd());
            GuiUtils.createButton(buttonPanel1, 'Remove Actor', () => this.doRemove());
        }
        
        if(ServerData.isGM()) {
            var buttonPanel2 = document.createElement('div');
            this.tab.appendChild(buttonPanel2);
            GuiUtils.createButton(buttonPanel2, 'Create Token', () => this.doCreateToken());
            GuiUtils.createButton(buttonPanel2, 'Set default Token', () => this.doSetDefaultToken());
            GuiUtils.createButton(buttonPanel2, 'Show Image', () => this.doShowImage());
        }
    }
    
    doOpen() {
        var id = this.tree.getSelectedValue();
        if(id) {
            var actor = EntityManagers.get('actor').find(id);
            if(actor) new CanvasWindowEditEntity(new EntityReference(actor));
        }
    }
    
    doAdd() {
        new CanvasWindowInput('New Actor', 'Enter Actor Name:', '', name => {
            if(name) {
                const actor = new Entity('actor');
                actor.prop('name').setString(name);
                EntityManagers.get('actor').add(actor);
            }
        });
    }
    
    doRemove() {
        const id = this.tree.getSelectedValue();
        if(id) {
            new CanvasWindowConfirm('Confirm removal', 'Are you sure you want to remove the actor: '+EntityManagers.get('actor').find(id).getName()+'?', () => {
                EntityManagers.get('actor').remove(id);
            });
        }
    }
    
    doCreateToken() {
        const id = this.tree.getSelectedValue();
        if(id) {
            const actor = EntityManagers.get('actor').find(id);
            const token = actor ? actor.prop('token').getEntity() : null;
            if(token) {
                if(Client.getState() instanceof StateMain && Client.getState().getMode() instanceof CanvasModeEntities && Client.getState().getMode().entityType == 'token') {
                    Client.getState().getMode().setAddEntityAction(token);
                }
            }
        }
    }
    
    doSetDefaultToken() {
        const id = this.tree.getSelectedValue();
        if(id) {
            const actor = EntityManagers.get('actor').find(id);
            if(actor) {
                if(Client.getState() instanceof StateMain && Client.getState().getMode() instanceof CanvasModeEntities && Client.getState().getMode().entityType == 'token') {
                    if(Client.getState().getMode().activeEntities.length == 1) {
                        const token = Client.getState().getMode().activeEntities[0].clone();

                        const ref = new EntityReference(actor);
                        ref.prop('token').setEntity(token);
                        ref.performUpdate();
                    }
                }
            }
        }
    }
    
    doShowImage() {
        const id = this.tree.getSelectedValue();
        if(id) {
            const actor = EntityManagers.get('actor').find(id);
            const token = actor ? actor.prop('token').getEntity() : null;
            if(token) {
                const imagePath = token.prop('imagePath').getString();
                if(imagePath && imagePath != '') {
                    const msg = new ActionCommand('SHOW_IMAGE', 0, 0, 0, false, '/data/files'+imagePath);
                    MessageService.send(msg);
                }
            }
        }
    }
}
