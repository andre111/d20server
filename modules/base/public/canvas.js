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

class CanvasView {
    constructor(profile, playerView, renderLights, renderWallOcclusion, renderWallLines) {
        this.profile = { id: profile.id, username: profile.username, role: (playerView ? Role.DEFAULT : Role.GM) };
        this.playerView = playerView;
        this.renderLights = renderLights;
        this.renderWallOcclusion = renderWallOcclusion;
        this.renderWallLines = renderWallLines;
    }
    
    getProfile() {
        return this.profile;
    }
    setProfile(profile) {
        this.profile = { id: profile.id, username: profile.username, role: (playerView ? Role.DEFAULT : Role.GM) };
    }
    
    isPlayerView() {
        return this.playerView;
    }
    
    doRenderLights() {
        return this.renderLights;
    }
    
    doRenderWallOcclusion() {
        return this.renderWallOcclusion;
    }
    
    doRenderWallLines() {
        return this.renderWallLines;
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
class MouseCanvasController {
    constructor(canvas) {
        this.mouseX = 0;
        this.mouseY = 0;
        this.canvas = canvas;
        
        canvas.addEventListener("keydown", e => this.keyPressed(e), true);
    }
    
    mouseDragged(e) {
        this.mouseX = e.xm;
        this.mouseY = e.ym;
        if(StateMain.mode != null) StateMain.mode.mouseDragged(e);
    }
    mouseMoved(e) {
        this.mouseX = e.xm;
        this.mouseY = e.ym;
        if(StateMain.mode != null) StateMain.mode.mouseMoved(e);
    }
    mouseWheelMoved(e) {
        if(StateMain.mode != null) StateMain.mode.mouseWheelMoved(e);
    }
    mouseClicked(e) {
        this.canvas.focus();
        //TODO: implement mode window and sidepanel toggle buttons
        if(StateMain.mode != null) StateMain.mode.mouseClicked(e);
    }
    mousePressed(e) {
        this.canvas.focus();
        if(StateMain.mode != null) StateMain.mode.mousePressed(e);
    }
    mouseReleased(e) {
        this.canvas.focus();
        if(StateMain.mode != null) StateMain.mode.mouseReleased(e);
    }
    mouseEntered(e) {
        StateMain.highlightToken = -1;
        if(StateMain.mode != null) StateMain.mode.mouseEntered(e);
    }
    mouseExited(e) {
        if(StateMain.mode != null) StateMain.mode.mouseExited(e);
    }
    
    keyPressed(e) {
		//TODO: should this be in a separate system?
        var action = InputService.getAction(e);
        if(action == InputService.CENTER_CAMERA) StateMain.centerCamera(false);
        if(action == InputService.PING_LOCATION) MessageService.send({ msg: "ActionCommand", command: "PING", id: 0, x: this.mouseX, y: this.mouseY, modified: false });
        if(action == InputService.PING_LOCATION_FOCUS) MessageService.send({ msg: "ActionCommand", command: "PING", id: 0, x: this.mouseX, y: this.mouseY, modified: true });
        //TODO: if(action == InputService.TOGGLE_MODE_WINDOW) ...
        //TODO: if(action == InputService.TOGGLE_SIDEPANE) ...
        
        if(StateMain.mode != null && action != null) StateMain.mode.actionPerformed(action);
    }
}

class CanvasMode extends MouseController {
    constructor() {
        super();
    }
    
    init() {}
    setLayer(layer) {}
    renderOverlay(ctx) {}
    actionPerformed(action) {}
}

class CanvasWindow {
    constructor(title, modal) {
        this.frame = WindowManager.createWindow(title, modal);
    }
    
    maximize() {
        $(this.frame).dialog("option", "position", { my: "left top", at: "left top", of: window });
        $(this.frame).dialog("option", "width", document.body.clientWidth);
        $(this.frame).dialog("option", "height", document.body.clientHeight);
    }
    
    getLocation() {
        //TODO: implement (use CRect)
    }
    
    setLocation(loc) {
        //TODO: implement
    }
    
    close() {
        $(this.frame).dialog("close");
    }
}
