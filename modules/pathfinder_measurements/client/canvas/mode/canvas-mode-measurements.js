import { CanvasMode } from '../../../../../core/client/canvas/canvas-mode.js';
import { Client } from '../../../../../core/client/client.js';
import { ServerData } from '../../../../../core/client/server-data.js';
import { MessageService } from '../../../../../core/client/service/message-service.js';
import { MapUtils } from '../../../../../core/client/util/maputil.js';

import { ActionCommand } from '../../../../../core/common/messages.js';

export class CanvasModeMeasurements extends CanvasMode {
    constructor(type, reset, step) {
        super();
        
        this.type = type;
        this.step = step | 0;
        if(reset) {
            this.deleteOwnMeasurement();
        }
    }

    init() {
        Client.getState().setControllHints([
            'mouse-left', 'controlls.measurements.apply',
            'mouse-right', 'controlls.measurements.remove',
            'key-Ctrl', 'controlls.disablesnap'
        ]);
    }

    exit() {
        // remove own 'measurement' on exit if it only is a non fixated starting point
        if(this.step == 0) {
            this.deleteOwnMeasurement();
        }
    }

    setLayer(layer) {
    }

    renderOverlay(ctx) {
    }

    actionPerformed(action) {
    }
    
    mouseReleased(e) {
		// left click
        if(e.which == 1) {
            if(this.step < 2) this.step++;
        }
        
        // right click
        if(e.which == 3) {
            this.deleteOwnMeasurement();
        }
    }
    
    mouseMoved(e) {
        var x = e.xm;
        var y = e.ym;
        var snap = !e.ctrlKey;
        if(snap) {
			// snap to grid (and corners) (set snap to true when control is NOT down)
            var map = MapUtils.currentMap();
            if(map != null && map != undefined) {
                x = Math.round(x / (map.getLong('gridSize')/2)) * (map.getLong('gridSize')/2);
                y = Math.round(y / (map.getLong('gridSize')/2)) * (map.getLong('gridSize')/2);
            }
        }
        
		// update measurement
        if(this.step == 0) {
            const msg = new ActionCommand('PF_MEASUREMENT', ServerData.currentMap, x, y, true, this.type);
            MessageService.send(msg);
        } else if(this.step == 1) {
            const msg = new ActionCommand('PF_MEASUREMENT', ServerData.currentMap, x, y, false, this.type);
            MessageService.send(msg);
        }
    }
    
    deleteOwnMeasurement() {
        const msg = new ActionCommand('PF_MEASUREMENT_RESET');
        MessageService.send(msg);
        this.step = 0;
    }
    
    deleteAllMeasurements() {
        const msg = new ActionCommand('PF_MEASUREMENT_RESET', 0, 0, 0, true);
        MessageService.send(msg);
        this.step = 0;
    }
}
