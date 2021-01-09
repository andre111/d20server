import { EntityAction } from './entity-action.js';
import { EntityManagers } from '../../../common/entity/entity-managers.js';

export class EntityActionAdd extends EntityAction {
    constructor(mode) {
        super(mode);
    }
    
    renderOverlay(ctx) {
        this.mode.renderActiveEntities(ctx, true, false);
    }
    
    mouseClicked(e) {
        if(e.which == 1) {
            for(const reference of this.mode.activeEntities) {
                EntityManagers.get(this.mode.entityType).add(reference.getModifiedEntity());
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
