import { Menu } from '../../gui/menu.js';
import { ServerData } from '../../server-data.js';
import { CanvasWindowEditEntity } from '../window/canvas-window-edit-entity.js';
import { CanvasWindowFitToGrid } from '../window/canvas-window-fit-to-grid.js';
import { MapUtils } from '../../util/maputil.js';
import { MessageService } from '../../service/message-service.js';

import { Access } from '../../../common/constants.js';
import { EntityManagers } from '../../../common/entity/entity-managers.js';
import { SendChatMessage } from '../../../common/messages.js';
import { Events } from '../../../common/events.js';
import { Client } from '../../app.js';

export class EntityMenu extends Menu {
    constructor(mode, reference, isGM, x, y) {
        super(x, y);

        this.mode = mode;
        this.reference = reference;
        
        var accessLevel = reference.getAccessLevel(ServerData.localProfile);
        
        // create html elements
        this.createItem(this.container, 'Edit', () => this.doEdit());
        
        if(this.mode.entityType == 'token') {
            // sending macros
            if(Access.matches(reference.prop('macroUse').getAccessValue(), accessLevel)) {
                // get and sort macros before adding to menu
                const names = Object.keys(reference.prop('macros').getStringMap());
                names.sort();
                
                if(names.length > 0) {
                    var macro = this.createCategory(this.container, 'Token Macros');
                    for(const name of names) {
                        if(name.startsWith('_')) continue;
                        
                        this.createItem(macro, name, () => this.doSendMacro(name));
                    }
                }
            }
            
            // sending actor macros
            var actor = EntityManagers.get('actor').find(reference.prop('actorID').getLong());
            if(actor != null && actor != undefined) {
                var actorAccessLevel = actor.getAccessLevel(ServerData.localProfile);
                if(Access.matches(actor.prop('macroUse').getAccessValue(), actorAccessLevel)) {
                    // get and sort macros before adding to menu
                    const names = Object.keys(actor.prop('macros').getStringMap());
                    names.sort();
                    
                    if(names.length > 0) {
                        var macro = this.createCategory(this.container, 'Actor Macros');
                        for(const name of names) {
                            if(name.startsWith('_')) continue;
                            
                            this.createItem(macro, name, () => this.doSendMacro(name));
                        }
                    }
                }

                // Inbuilt macros
                var actorMacro = this.createCategory(this.container, 'Inbuilt Macros');
                
                //TODO: get and sort macros before adding to menu
                var macros = actor.getPredefinedMacros();
                
				// add macros to menu with categories
                var categories = new Map();
                for(const [key, value] of Object.entries(macros)) {
                    // find or create category sub menu
                    var parent = actorMacro;
                    var category = value.category;
                    if(category != null && category != undefined && category != '') {
                        if(!categories.has(category)) {
                            var cat = this.createCategory(actorMacro, category);
                            categories.set(category, cat);
                        }
                        parent = categories.get(category);
                    }
                    
                    // add macro entry
                    this.createItem(parent, value.displayName, () => this.doSendMacro('!'+key));
                }
            }
        }

        //TODO: move most functionality to listeners of this event!
        Events.trigger('entityMenu', { 
            menu: this, 
            entityType: this.mode.entityType, 
            reference: reference, 
            isGM: isGM 
        });
        
        if(reference.prop('depth').canEdit(accessLevel)) {
            var move = this.createCategory(this.container, 'Move');
            this.createItem(move, 'to front', () => this.doMoveToFront());
            this.createItem(move, 'to back', () => this.doMoveToBack());
        }
        
        // gm actions
        if(isGM) {
            if(this.mode.entityType == 'token') {
                this.createItem(this.container, 'Fit to Grid', () => this.doFitToGrid());
            }
            
            this.createItem(this.container, 'Delete', () => this.doDelete());
        }
        
        this.open();
    }
    
    doEdit() {
        new CanvasWindowEditEntity(this.reference);
    }
    
    doSendMacro(macroName) {
        const msg = new SendChatMessage('!'+macroName);
        MessageService.send(msg);
    }
    
    doMoveToFront() {
        var currentMinDepth = MapUtils.currentEntitiesInLayer(this.mode.entityType, Client.getState().getLayer()).map(e => e.prop('depth').getLong()).reduce((a, b) => Math.min(a, b), 0);
        if(currentMinDepth == undefined) currentMinDepth = 0;
        this.reference.prop('depth').setLong(currentMinDepth-1);
        this.reference.performUpdate();
    }
    
    doMoveToBack() {
        var currentMaxDepth = MapUtils.currentEntitiesInLayer(this.mode.entityType, Client.getState().getLayer()).map(e => e.prop('depth').getLong()).reduce((a, b) => Math.max(a, b), 0);
        if(currentMaxDepth == undefined) currentMaxDepth = 0;
        this.reference.prop('depth').setLong(currentMaxDepth+1);
        this.reference.performUpdate();
    }
    
    doFitToGrid() {
        new CanvasWindowFitToGrid(this.reference);
    }
    
    doDelete() {
        EntityManagers.get(this.mode.entityType).remove(this.reference.getID());
        this.mode.clearActiveEntities();
    }
}
