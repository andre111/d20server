class ISAction {
    constructor(action, keyCode, shift, ctrl, alt) {
        this.action = action;
        this.keyCode = keyCode;
        this.shift = shift;
        this.ctrl = ctrl;
        this.alt = alt;
    }
    
    matches(e) {
        // check event match
        return e.keyCode == this.keyCode && this.shift == e.shiftKey && this.ctrl == e.ctrlKey && this.alt == e.altKey;
    }
}

InputService = {
    _allActions: [],
    _registerAction: function(action) {
        InputService._allActions.push(action);
        return action;
    },
    
    getAction: function(e) {
        for(var action of InputService._allActions) {
            if(action.matches(e)) {
                return action.action;
            }
        }
        return null;
    },
    
    MOVE_LEFT: "move_left",
    MOVE_RIGHT: "move_right",
    MOVE_UP: "move_up",
    MOVE_DOWN: "move_down",
    
    ROTATE_LEFT: "rotate_left",
    ROTATE_RIGHT: "rotate_right",
    
    CENTER_CAMERA: "center_camera",
    PING_LOCATION: "ping_location",
    PING_LOCATION_FOCUS: "ping_location_focus",
    
    TOGGLE_MODE_WINDOW: "toggle_mode_window",
    TOGGLE_SIDEPANE: "toggle_sidepane",
    
    COPY: "copy",
    PASTE: "paste",
    DELETE: "delete"
}

InputService._registerAction(new ISAction(InputService.MOVE_LEFT, 37 /*LEFT*/, false, false, false));
InputService._registerAction(new ISAction(InputService.MOVE_RIGHT, 39 /*RIGHT*/, false, false, false));
InputService._registerAction(new ISAction(InputService.MOVE_UP, 38 /*UP*/, false, false, false));
InputService._registerAction(new ISAction(InputService.MOVE_DOWN, 40 /*DOWN*/, false, false, false));

InputService._registerAction(new ISAction(InputService.ROTATE_LEFT, 37 /*LEFT*/, true, false, false));
InputService._registerAction(new ISAction(InputService.ROTATE_RIGHT, 39 /*RIGHT*/, true, false, false));

InputService._registerAction(new ISAction(InputService.CENTER_CAMERA, 67 /*C*/, false, false, false));
InputService._registerAction(new ISAction(InputService.PING_LOCATION, 80 /*P*/, false, false, false));
InputService._registerAction(new ISAction(InputService.PING_LOCATION_FOCUS, 80 /*P*/, true, false, false));

InputService._registerAction(new ISAction(InputService.TOGGLE_MODE_WINDOW, 77 /*M*/, false, false, false));
InputService._registerAction(new ISAction(InputService.TOGGLE_SIDEPANE, 84 /*T*/, false, false, false));

InputService._registerAction(new ISAction(InputService.COPY, 67 /*C*/, false, true, false));
InputService._registerAction(new ISAction(InputService.PASTE, 86 /*V*/, false, true, false));
InputService._registerAction(new ISAction(InputService.DELETE, 46 /*DELETE*/, false, false, false));
