import { Menu } from '../../gui/menu.js';
import { ServerData } from '../../server-data.js';
import { CanvasWindowEditEntity } from '../window/canvas-window-edit-entity.js';
import { CanvasWindowFitToGrid } from '../window/canvas-window-fit-to-grid.js';
import { MapUtils } from '../../util/maputil.js';
import { MessageService } from '../../service/message-service.js';

import { Access } from '../../../common/constants.js';
import { EntityManagers } from '../../../common/entity/entity-managers.js';
import { TokenListUtils } from '../../../common/util/token-list-util.js';
import { SendChatMessage, TokenListValue } from '../../../common/messages.js';

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
                var macro = this.createCategory(this.container, 'Macros');
                for(const [key, value] of Object.entries(reference.prop('macros').getStringMap())) {
                    this.createItem(macro, key, () => this.doSendMacro(key));
                }
            }
            
            // sending actor macros
            var actor = EntityManagers.get('actor').find(reference.prop('actorID').getLong());
            if(actor != null && actor != undefined) {
                var actorMacro = this.createCategory(this.container, 'Actor Macros');
                
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
            
            // adding to lists
            //TODO: this is broken/the access check seems to be wrong somehow
            var list = this.createCategory(this.container, 'Add to');
            _.chain(EntityManagers.get('token_list').all()).forEach(tokenList => {
                var listAccessLevel = TokenListUtils.getAccessLevel(ServerData.localProfile, tokenList, reference.getBackingEntity());
                if(tokenList.canEditWithAccess(listAccessLevel)) {
                    this.createItem(list, tokenList.prop('displayName').getString(), () => this.doTokenListInsert(tokenList));
                }
            }).value();
        }
        
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
    
    doTokenListInsert(tokenList) {
        const msg = new TokenListValue(tokenList, this.reference.getID(), 0, false, false);
        MessageService.send(msg);
    }
    
    doMoveToFront() {
        var currentMinDepth = MapUtils.currentEntitiesInLayer(this.mode.entityType, this.mode.layer).map(e => e.prop('depth').getLong()).min().value();
        if(currentMinDepth == undefined) currentMinDepth = 0;
        this.reference.prop('depth').setLong(currentMinDepth-1);
        this.reference.performUpdate();
    }
    
    doMoveToBack() {
        var currentMaxDepth = MapUtils.currentEntitiesInLayer(this.mode.entityType, this.mode.layer).map(e => e.prop('depth').getLong()).max().value();
        if(currentMaxDepth == undefined) currentMaxDepth = 0;
        this.reference.prop('depth').setLong(currentMaxDepth+1);
        this.reference.performUpdate();
    }
    
    doFitToGrid() {
        new CanvasWindowFitToGrid(this.reference);
    }
    
    doDelete() {
        EntityManagers.get(this.mode.entityType).remove(this.reference.id);
        this.mode.clearActiveEntities();
    }
}
