class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.scale = 1;
        
        this.xTarget = 0;
        this.yTarget = 0;
        
        this.screenWidth = 0;
        this.screenHeight = 0;
        
        this.minScale = 0.2;
        this.maxScale = 2;
    }
    
    update(screenWidth, screenHeight) {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        
        this.x = this.x + (this.xTarget - this.x) * 0.2;
        this.y = this.y + (this.yTarget - this.y) * 0.2;
    }
    
    getTransform() {
        return compose(
            translate(this.screenWidth/2, this.screenHeight/2),
            scale(this.scale, this.scale),
            translate(-this.x, -this.y)
        );
    }
    
    getViewport() {
        var w = Math.ceil(this.screenWidth / this.scale);
        var h = Math.ceil(this.screenHeight / this.scale);
        return new CRect(this.x-w/2, this.y-h/2, w, h);
    }
    
    getX() {
        return this.x;
    }
    
    getY() {
        return this.y;
    }
    
    inverseTransform(x, y) {
        return applyToPoint(inverse(this.getTransform()), { x: x, y: y });
    }
    
    setLocation(x, y, instant) {
        this.xTarget = x;
        this.yTarget = y;
        if(instant) {
            this.x = x;
            this.y = y;
        }
    }
    
    drag(xd, yd) {
        this.setLocation(this.x + xd, this.y + yd, true);
    }
    
    zoom(dir) {
        if(dir > 0) {
            this.scale *= 0.9;
        } else {
            this.scale /= 0.9;
        }
        this.scale = Math.max(this.minScale, Math.min(this.scale, this.maxScale));
    }
}

class CanvasView {
    constructor(profile, playerView, renderLights, renderWallOcclusion, renderWallLines) {
        this.profile = { id: profile.id, username: profile.username, role: (playerView ? Role.DEFAULT : Role.GM) };
        this.playerView = playerView;
        this.renderLights = renderLights;
        this.renderWallOcclusion = renderWallOcclusion;
        this.renderWallLines = renderWallLines;
        
        this.forceWallOcclusion;
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
        return this.renderWallOcclusion || this.forceWallOcclusion;
    }
    
    doRenderWallLines() {
        return this.renderWallLines;
    }
    
    setForceWallOcclusion(forceWallOcclusion) {
        this.forceWallOcclusion = forceWallOcclusion;
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
        
        this.camera.zoom(e.deltaY);
        if(this.child != null) this.child.mouseWheelMoved(this.adjustPosition(e));
    }
    mouseClicked(e) {
        e.preventDefault();
        e.xm = e.offsetX;
        e.ym = e.offsetY;
        
        if(this.child != null && !e.altKey) this.child.mouseClicked(this.adjustPosition(e));
    }
    mousePressed(e) {
        e.preventDefault();
        e.xm = e.offsetX;
        e.ym = e.offsetY;
        
        if(e.which == 2 || e.altKey) {
            this.dragCamera = true;
        } else {
            if(this.child != null) this.child.mousePressed(this.adjustPosition(e));
        }
    }
    mouseReleased(e) {
        e.preventDefault();
        e.xm = e.offsetX;
        e.ym = e.offsetY;
        
        if(e.which == 2 || e.altKey) {
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
        StateMain.viewToken = -1;
        if(StateMain.mode != null) StateMain.mode.mousePressed(e);
    }
    mouseReleased(e) {
        //this.canvas.focus(); // this causes issues, like when trying to select text but moving the mouse on the canvas before release, the above should be enough anyway
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
        if(action == InputService.PING_LOCATION) MessageService.send({ msg: "PlayEffect", effect: "PING", x: this.mouseX, y: this.mouseY, rotation: 0, scale: 1, aboveOcclusion: true, focusCamera: false });
        if(action == InputService.PING_LOCATION_FOCUS) MessageService.send({ msg: "PlayEffect", effect: "PING", x: this.mouseX, y: this.mouseY, rotation: 0, scale: 1, aboveOcclusion: true, focusCamera: true });
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
        this.frame = WindowManager.createWindow(title, modal, () => { this.onClose(); });
        $(this.frame).dialog("option", "maxHeight", document.body.clientHeight);
        this.isClosed = false;
    }
    
    maximize() {
        $(this.frame).dialog("option", "position", { my: "left top", at: "left top", of: window });
        $(this.frame).dialog("option", "width", document.body.clientWidth);
        $(this.frame).dialog("option", "height", document.body.clientHeight);
    }
    
    getLocation() {
        var position = $(this.frame).dialog("option", "position");
        delete position["of"];
        
        var loc = {
            position: position,
            width: $(this.frame).dialog("option", "width"),
            height: $(this.frame).dialog("option", "height")
        };
        return loc;
    }
    
    setLocation(loc) {
        loc.position.of = window;
        
        $(this.frame).dialog("option", "position", loc.position);
        $(this.frame).dialog("option", "width", loc.width);
        $(this.frame).dialog("option", "height", loc.height);
    }
    
    close() {
        if(this.isClosed) return;
        
        this.isClosed = $(this.frame).dialog("close");
    }
    
    onClose() {
        this.isClosed = true;
    }
}

class CanvasRenderLayer {
    constructor() {
    }
    
    render(ctx, view, viewers, camera, viewport, map) {
    }
    
    getLevel() {
        return 0;
    }
}
class CanvasEntityRenderer {
    constructor() {
    }
    
    render(ctx, view, entity) {
    }
}
