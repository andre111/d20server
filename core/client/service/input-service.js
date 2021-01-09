class ISAction {
    constructor(name, keyCode, shift, ctrl, alt) {
        this.name = name;
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

var _actions = [];
export const InputService = {
    registerAction: function(name, keyCode, shift, ctrl, alt) {
        _actions.push(new ISAction(name, keyCode, shift, ctrl, alt));
    },

    getAction: function(e) {
        for(const action of _actions) {
            if(action.matches(e)) {
                return action.name;
            }
        }
        return null;
    }
}
