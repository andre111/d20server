let {scale, rotate, translate, compose, inverse, applyToPoint} = window.TransformationMatrix;

_g = {
    VERSION: 8
}
class CRect {
    constructor(x, y, width, height) {
        this.x = Math.trunc(x);
        this.y = Math.trunc(y);
        this.width = Math.trunc(width);
        this.height = Math.trunc(height);
    }
    
    toPath() {
        var path = [];
        path.push({ X: this.x, Y: this.y });
        path.push({ X: this.x+this.width, Y: this.y });
        path.push({ X: this.x+this.width, Y: this.y+this.height });
        path.push({ X: this.x, Y: this.y+this.height });
        return path;
    }
}


function init() {
    setState(StateInit);
}

function setState(state) {
    if(_g.currentState != null && _g.currentState != undefined) {
        _g.currentState.exit();
    }
    _g.currentState = state;
    _g.currentState.init();
}
