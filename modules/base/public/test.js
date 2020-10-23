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
        return new Viewport(x-w/2, y-h/2, w, h);
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
class Viewport {
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
    // get reference to main canvas
    _g.canvas = document.getElementById("canvas");
    _g.ctx = _g.canvas.getContext("2d");
    
    // create offscreen canvas as a render buffer
    _g.buffer = document.createElement("canvas");
    _g.bctx = _g.buffer.getContext("2d");
    
    // add mouse controller
    mcc = new MouseCameraContoller(camera, null);
    canvas.addEventListener("mousemove", e => mcc.onMove(e), true);
    canvas.addEventListener("wheel", e => mcc.mouseWheelMoved(e), true);
    canvas.addEventListener("click", e => mcc.mouseClicked(e), true);
    canvas.addEventListener("contextmenu", e => mcc.mouseClicked(e), true);
    canvas.addEventListener("mousedown", e => mcc.mousePressed(e), true);
    canvas.addEventListener("mouseup", e => mcc.mouseReleased(e), true);
    canvas.addEventListener("mouseenter", e => mcc.mouseEntered(e), true);
    canvas.addEventListener("mouseleave", e => mcc.mouseExited(e), true);
    
    // calculate fps times
    _g.fpsInterval = 1000 / 30;
    _g.lastFrame = Date.now();
    
    // start rendering
    onFrame();
    
    //TODO: remove test stuff
    var dialog = WindowManager.createWindow("Modal Test", true);
    dialog.appendChild(document.createTextNode("Jetzt auch mit Testinhalt!"));
    
    dialog = WindowManager.createWindow("Test 2", false);
    dialog.appendChild(document.createTextNode("Jetzt auch mit mehr Testinhalt!"));
    
    // add tabs TODO: add content
    var tab = null;
    tab = SidepanelManager.createTab("Chat", "chat");
    tab = SidepanelManager.createTab("Players", "players");
    tab = SidepanelManager.createTab("Actors", "actors");
    tab = SidepanelManager.createTab("Attachments", "attachments");
    tab = SidepanelManager.createTab("Maps", "maps");
    tab = SidepanelManager.createTab("Images", "images");
    tab = SidepanelManager.createTab("Audio", "audio");
    tab = SidepanelManager.createTab("Lists", "lists");
    tab = SidepanelManager.createTab("Settings", "settings");
    SidepanelManager.init();
}

function onFrame() {
    // schedule next frame
    requestAnimationFrame(onFrame);
    
    // adjust canvas sizes
    resize(_g.canvas, _g.buffer);
    
    // calculate time
    var now = Date.now();
    var elapsed = now - _g.lastFrame;
    
    // render frame when at correct time
    if(elapsed > _g.fpsInterval) {
        _g.lastFrame = now - (elapsed % _g.fpsInterval);
        
        draw();
    }
}

function resize(canvas, buffer) {
    _g.width = canvas.clientWidth;
    _g.height = canvas.clientHeight;
    
    // resize canvas and buffer to match display size
    if(canvas.width != _g.width || canvas.height != _g.height) {
        canvas.width = _g.width;
        canvas.height = _g.height;
    }
    if(buffer.width != _g.width || buffer.height != _g.height) {
        buffer.width = _g.width;
        buffer.height = _g.height;
    }
}

function draw() {
    var ctx = _g.ctx;
    var bctx = _g.bctx;
    
    /*
    // testing off screen buffer rendering
    bctx.beginPath();
    bctx.rect(20, 40, 50, 50);
    bctx.fillStyle = "#FF0000";
    bctx.fill();
    bctx.closePath();
    
    bctx.beginPath();
    bctx.arc(240, 160, 20, 0, Math.PI*2, false);
    bctx.fillStyle = "green";
    bctx.fill();
    bctx.closePath();
    
    // display buffer
    ctx.drawImage(_g.buffer, 0, 0);
    */
    
    //---------------------------------------
    //based somewhat on actual MapCanvas implementation in current client:
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.rect(0, 0, _g.width, _g.height);
    ctx.fill();
    ctx.closePath();
    
    camera.update();
    ctx.save();
    ctx.setTransform(camera.getTransform());
    
    // draw grid
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.39)";
    for(x = 0; x <= 100; x++) {
        ctx.beginPath();
        ctx.moveTo(x * 70, 0 * 70);
        ctx.lineTo(x * 70, 100 * 70);
        ctx.stroke();
        ctx.closePath();
    }
    for(y = 0; y <= 100; y++) {
        ctx.beginPath();
        ctx.moveTo(0 * 70, y * 70);
        ctx.lineTo(100 * 70, y * 70);
        ctx.stroke();
        ctx.closePath();
    }
    
    var img = ImageService.getImage(10);
    if(img != null) {
        ctx.drawImage(img, 0, 0);
    }
    
    ctx.restore();
}
