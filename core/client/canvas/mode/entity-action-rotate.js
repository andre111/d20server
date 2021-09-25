import { EntityAction } from './entity-action.js';
import { EntityActionSelect } from './entity-action-select.js';
import { Client } from '../../client.js';

export class EntityActionRotate extends EntityAction {
    constructor(mode) {
        super(mode);
    }

    init() {
        Client.getState().setControllHints([
            'mouse-left', 'controlls.rotate'
        ]);
    }
    
    doRotation(xm, ym, snap) {
        var reference = this.mode.activeEntities[0];
        var rotation = 0;
        
        // calculate angle between mouse and upwards
		var angle = Math.atan2(xm-reference.getLong('x'), ym-reference.getLong('y'));
		angle -= Math.PI;
		rotation -= angle;
        
        // convert back to degrees
		rotation = Math.round(rotation * 180 / Math.PI);
		
		// snap
		if(snap) {
			rotation = Math.round(rotation / 45) * 45;
		}
        
        rotation = rotation % 360;
		
		reference.setDouble('rotation', rotation);
    }
    
    finishRotation() {
        for(var reference of this.mode.activeEntities) {
            reference.performUpdate();
        }
        this.mode.setAction(new EntityActionSelect(this.mode));
    }
    
    renderOverlay(ctx) {
        this.mode.renderActiveEntities(ctx, true, true);
    }
    
    mouseReleased(e) {
        if(e.which == 1) {
            this.finishRotation();
        }
    }
    
    mouseMoved(e) {
        this.doRotation(e.xm, e.ym, !e.ctrlKey);
    }
    
    mouseDragged(e) {
        this.doRotation(e.xm, e.ym, !e.ctrlKey);
    }
}
