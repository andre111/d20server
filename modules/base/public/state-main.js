StateMain = {
    init: function() {
        // create base elements
        var canvas = document.createElement("canvas");
        canvas.id = "canvas";
        document.body.appendChild(canvas);
        var sidepanel = document.createElement("div");
        sidepanel.id = "sidepanel";
        sidepanel.appendChild(document.createElement("ul"));
        document.body.appendChild(sidepanel);
        var overlay = document.createElement("overlay");
        overlay.id = "overlay";
        document.body.appendChild(overlay);
        
        //TODO: ...
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
        StateMain.onFrame();
        
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
    },
    
    exit: function() {
        //TODO: improve this
        document.body.innerHTML = "";
    },
    
    onFrame: function() {
        // schedule next frame
        requestAnimationFrame(StateMain.onFrame);
        
        // adjust canvas sizes
        StateMain.resize(_g.canvas, _g.buffer);
        
        // calculate time
        var now = Date.now();
        var elapsed = now - _g.lastFrame;
        
        // render frame when at correct time
        if(elapsed > _g.fpsInterval) {
            _g.lastFrame = now - (elapsed % _g.fpsInterval);
            
            StateMain.draw();
        }
    },
    
    resize: function(canvas, buffer) {
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
    },
    
    draw: function() {
        var ctx = _g.ctx;
        var bctx = _g.bctx;
        
        ctx.font = "12px arial";
        
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
        var map = MapUtils.currentMap();
        
        //
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.rect(0, 0, _g.width, _g.height);
        ctx.fill();
        ctx.closePath();
        if(map == null || map == undefined /* || view == null || view == undefined || (viewers is empty && hideWithNoMainToken && view.isPlayerView())*/) {
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.rect(0, 0, _g.width, _g.height);
            ctx.fill();
            ctx.closePath();
            return;
        }
        var gridSize = map.prop("gridSize").getLong();
        
        camera.update();
        ctx.save();
        ctx.setTransform(camera.getTransform());
        
        // draw background tokens
        //TODO: all parameters
        TokenRenderer.renderTokens(ctx, MapUtils.currentEntitiesSorted("token", Layer.BACKGROUND), null, -1, false);
        DrawingRenderer.renderDrawings(ctx, MapUtils.currentEntitiesSorted("drawing", Layer.BACKGROUND));
        
        // draw grid
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.39)";
        for(x = 0; x <= map.prop("width").getLong(); x++) {
            ctx.beginPath();
            ctx.moveTo(x * gridSize, 0 * gridSize);
            ctx.lineTo(x * gridSize, 100 * gridSize);
            ctx.stroke();
            ctx.closePath();
        }
        for(y = 0; y <= map.prop("height").getLong(); y++) {
            ctx.beginPath();
            ctx.moveTo(0 * gridSize, y * gridSize);
            ctx.lineTo(100 * gridSize, y * gridSize);
            ctx.stroke();
            ctx.closePath();
        }
        
        // draw main tokens
        //TODO: all parameters
        TokenRenderer.renderTokens(ctx, MapUtils.currentEntitiesSorted("token", Layer.MAIN), null, -1, false);
        DrawingRenderer.renderDrawings(ctx, MapUtils.currentEntitiesSorted("drawing", Layer.MAIN));
        
        ctx.restore();
    }
}
