let {scale, rotate, translate, compose, inverse, applyToPoint} = window.TransformationMatrix;

_g = {}
camera = {
    x: 0,
    y: 0,
    scale: 1,
    
    xTarget: 0,
    yTarget: 0,
    
    update: function() {
        this.x = this.x + (this.xTarget - this.x) * 0.2;
        this.y = this.y + (this.yTarget - this.y) * 0.2;
    },
    
    getTransform: function() {
        return compose(
            translate(_g.width/2, _g.height/2),
            scale(this.scale, this.scale),
            translate(-this.x, -this.y)
        );
    },
    
    getViewport: function() {
        var w = Math.ceil(_g.width / this.scale);
        var h = Math.ceil(_g.height / this.scale);
        return new CRect(this.x-w/2, this.y-h/2, w, h);
    },
    
    inverseTransform: function(x, y) {
        return applyToPoint(inverse(this.getTransform()), { x: x, y: y });
    },
    
    setLocation: function(x, y, instant) {
        this.xTarget = x;
        this.yTarget = y;
        if(instant) {
            this.x = x;
            this.y = y;
        }
    },
    drag: function(xd, yd) {
        this.setLocation(this.x + xd, this.y + yd, true);
    },
    zoom: function(dir) {
        if(dir > 0) {
            this.scale *= 0.9;
        } else {
            this.scale /= 0.9;
        }
        this.scale = Math.max(0.2, Math.min(this.scale, 2));
    }
}
class CRect {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
}
class MouseController {
    constructor() {
    }
    
    mouseDragged(e) {}
    mouseMoved(e) {}
    mouseWheelMoved(e) {}
    mouseClicked(e) {}
    mousePressed(e) {}
    mouseReleased(e) {}
    mouseEntered(e) {}
    mouseExited(e) {}
}
class MouseCameraContoller extends MouseController {
    constructor(camera, child) {
        super();
        
        this.camera = camera;
        this.child = child;
        this.dragCamera = false;
        this.lastMousePos = null;
    }
    
    onMove(e) {
        if(e.which == 0) {
            this.mouseMoved(e);
        } else {
            this.mouseDragged(e);
        }
    }
    
    mouseDragged(e) {
        e.preventDefault();
        e.xm = e.offsetX;
        e.ym = e.offsetY;
        
        var doDrag = this.dragCamera || e.altKey;
        if(doDrag) {
            var mousePos = this.camera.inverseTransform(e.xm, e.ym);
            this.camera.drag(this.lastMousePos.x-mousePos.x, this.lastMousePos.y-mousePos.y);
        }
        this.lastMousePos = this.camera.inverseTransform(e.xm, e.ym);
        if(this.child != null && !doDrag) this.child.mouseDragged(this.adjustPosition(e));
    }
    mouseMoved(e) {
        e.preventDefault();
        e.xm = e.offsetX;
        e.ym = e.offsetY;
        
        this.lastMousePos = this.camera.inverseTransform(e.xm, e.ym);
        if(this.child != null) this.child.mouseMoved(this.adjustPosition(e));
    }
    mouseWheelMoved(e) {
        e.preventDefault();
        e.xm = e.offsetX;
        e.ym = e.offsetY;
        
        camera.zoom(e.deltaY);
        if(this.child != null) this.child.mouseWheelMoved(this.adjustPosition(e));
    }
    mouseClicked(e) {
        e.preventDefault();
        e.xm = e.offsetX;
        e.ym = e.offsetY;
        
        if(this.child != null) this.child.mouseClicked(this.adjustPosition(e));
    }
    mousePressed(e) {
        e.preventDefault();
        e.xm = e.offsetX;
        e.ym = e.offsetY;
        
        if(e.which == 2) {
            this.dragCamera = true;
        } else {
            if(this.child != null) this.child.mousePressed(this.adjustPosition(e));
        }
    }
    mouseReleased(e) {
        e.preventDefault();
        e.xm = e.offsetX;
        e.ym = e.offsetY;
        
        if(e.which == 2) {
            this.dragCamera = false;
        } else {
            if(this.child != null) this.child.mouseReleased(this.adjustPosition(e));
        }
    }
    mouseEntered(e) {
        e.preventDefault();
        e.xm = e.offsetX;
        e.ym = e.offsetY;
        
        if(this.child != null) this.child.mouseEntered(this.adjustPosition(e));
    }
    mouseExited(e) {
        e.preventDefault();
        e.xm = e.offsetX;
        e.ym = e.offsetY;
        
        this.dragCamera = false;
        if(this.child != null) this.child.mouseExited(this.adjustPosition(e));
    }
    
    adjustPosition(e) {
        var pos = this.camera.inverseTransform(e.xm, e.ym);
        e.xm = pos.x;
        e.ym = pos.y;
        return e;
    }
}


function init() {
    Connection.init(start);
    ImageService.init();
}
    
function start() {
    document.body.innerHTML = "";
    setState(StateSignIn);
}

function setState(state) {
    if(_g.currentState != null && _g.currentState != undefined) {
        _g.currentState.exit();
    }
    _g.currentState = state;
    _g.currentState.init();
}
