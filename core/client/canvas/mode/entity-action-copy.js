import { EntityAction } from './entity-action.js';
import { CopyEntity } from '../../../common/messages.js';
import { MessageService } from '../../service/message-service.js';
import { Client } from '../../client.js';

export class EntityActionCopy extends EntityAction {
    constructor(mode) {
        super(mode);
    }

    init() {
        Client.getState().setControllHints([
            'mouse-left', 'controlls.add.'+this.mode.entityType,
            'mouse-right', 'global.cancel',
            'key-Ctrl', 'controlls.disablesnap'
        ]);
    }
    
    renderOverlay(ctx) {
        this.mode.renderActiveEntities(ctx, true, false);
    }
    
    mouseClicked(e) {
        if(e.which == 1) {
            for(const reference of this.mode.activeEntities) {
                const msg = new CopyEntity(reference.getManager(), reference.getID(), reference.getManager(), reference.getModifiedProperties());
                MessageService.send(msg);
            }
            this.mode.resetAction();
        } else if(e.which == 3) {
            this.mode.resetAction();
        }
    }
    
    mouseMoved(e) {
        this.mode.adjustPositions(e.xm, e.ym, !e.ctrlKey, false);
    }
    
    mouseDragged(e) {
        this.mode.adjustPositions(e.xm, e.ym, !e.ctrlKey, false);
    }
}
