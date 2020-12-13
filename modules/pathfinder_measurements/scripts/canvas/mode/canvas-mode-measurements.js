class CanvasModeMeasurements extends CanvasMode {
    constructor(type, reset, step) {
        super();
        
        this.type = type;
        this.step = step | 0;
        if(reset) {
            this.deleteOwnMeasurement();
        }
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
                x = Math.round(x / (map.prop("gridSize").getLong()/2)) * (map.prop("gridSize").getLong()/2);
                y = Math.round(y / (map.prop("gridSize").getLong()/2)) * (map.prop("gridSize").getLong()/2);
            }
        }
        
		// update measurement
        if(this.step == 0) {
            var msg = {
                msg: "ActionCommand",
                command: "PF_MEASUREMENT",
                id: ServerData.currentMap.get(),
                x: x,
                y: y,
                modified: true,
                text: this.type
            };
            MessageService.send(msg);
        } else if(this.step == 1) {
            var msg = {
                msg: "ActionCommand",
                command: "PF_MEASUREMENT",
                id: ServerData.currentMap.get(),
                x: x,
                y: y,
                modified: false,
                text: this.type
            };
            MessageService.send(msg);
        }
    }
    
    deleteOwnMeasurement() {
        var msg = {
            msg: "ActionCommand",
            command: "PF_RESET_MEASUREMENT"
        };
        MessageService.send(msg);
        this.step = 0;
    }
    
    deleteAllMeasurements() {
        var msg = {
            msg: "ActionCommand",
            command: "PF_RESET_MEASUREMENT",
            modified: true
        };
        MessageService.send(msg);
        this.step = 0;
    }
}
