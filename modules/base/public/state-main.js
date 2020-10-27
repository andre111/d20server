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
        
        //...
        ServerData.currentMap.addObserver(StateMain.onMapChange);
        
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
    
    onMapChange: function(id) {
        //TODO: mode.init();
        
        FOWRenderer.reset();
        StateMain.centerCamera(true);
    },
    
    //TODO: create actual view implementation
    lastCenteredTokenID: -1,
    view: {
        getProfile: function() {
            return ServerData.localProfile;
        },
        doRenderWallOcclusion: function() {
            return true;
        },
        doRenderWallLines: function() {
            return true;
        },
        doRenderLights: function() {
            return true;
        },
        isPlayerView: function() {
            return true;
        }
    },
    highlightToken: -1,
    
    centerCamera: function(instant) {
        var map = MapUtils.currentMap();
        if(map == null || map == undefined) return;
        
        var camTargetX = map.prop("width").getLong() * map.prop("gridSize").getLong() / 2;
		var camTargetY = map.prop("height").getLong() * map.prop("gridSize").getLong() / 2;
		
		// find a controlled token to center on
		var controllableTokens = MapUtils.findControllableTokens(StateMain.view.getProfile());
		if(controllableTokens.length > 0) {
			// find index of last token we focused on
			var lastIndex = -1;
			for(var i=0; i<controllableTokens.length; i++) {
				if(controllableTokens[i].id == StateMain.lastCenteredTokenID) {
					lastIndex = i;
				}
			}
			
			// focus on the next one
			var index = (lastIndex + 1) % controllableTokens.length;
			camTargetX = controllableTokens[index].prop("x").getLong();
			camTargetY = controllableTokens[index].prop("y").getLong();
			StateMain.lastCenteredTokenID = controllableTokens[index].id;
		}
		
		camera.setLocation(camTargetX, camTargetY, instant);
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
        
        // find viewers
        var viewers = [];
        MapUtils.currentEntities("token").forEach(token => {
            var accessLevel = token.getAccessLevel(StateMain.view.getProfile());
            if(Access.matches(token.prop("sharedVision").getAccessValue(), accessLevel)) {
                viewers.push(token);
            }
        }).value();
        
        //
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.rect(0, 0, _g.width, _g.height);
        ctx.fill();
        ctx.closePath();
        if(map == null || map == undefined || StateMain.view == null || StateMain.view == undefined /*|| (viewers is empty && hideWithNoMainToken && StateMain.view.isPlayerView())*/) {
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.rect(0, 0, _g.width, _g.height);
            ctx.fill();
            ctx.closePath();
            return;
        }
        var gridSize = map.prop("gridSize").getLong();
        
        camera.update();
        var viewport = camera.getViewport();
        ctx.save();
        ctx.setTransform(camera.getTransform());
        
        // draw background tokens
        TokenRenderer.renderTokens(ctx, MapUtils.currentEntitiesSorted("token", Layer.BACKGROUND), StateMain.view.getProfile(), StateMain.highlightToken, false);
        DrawingRenderer.renderDrawings(ctx, MapUtils.currentEntitiesSorted("drawing", Layer.BACKGROUND));
        
        // draw grid
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.39)";
        for(x = 0; x <= map.prop("width").getLong(); x++) {
            ctx.beginPath();
            ctx.moveTo(x * gridSize, 0 * gridSize);
            ctx.lineTo(x * gridSize, 100 * gridSize);
            ctx.stroke();
        }
        for(y = 0; y <= map.prop("height").getLong(); y++) {
            ctx.beginPath();
            ctx.moveTo(0 * gridSize, y * gridSize);
            ctx.lineTo(100 * gridSize, y * gridSize);
            ctx.stroke();
        }
        
        // draw main tokens
        TokenRenderer.renderTokens(ctx, MapUtils.currentEntitiesSorted("token", Layer.MAIN), StateMain.view.getProfile(), StateMain.highlightToken, false);
        DrawingRenderer.renderDrawings(ctx, MapUtils.currentEntitiesSorted("drawing", Layer.MAIN));
        
        //TODO: EffectRenderer
        //TODO: WeatherRenderer
        
        // draw wall occlusion / fow background
        if(StateMain.view.doRenderWallOcclusion()) {
            // render
            if(viewers.length != 0) {
                // extend viewport to avoid rounding errors
                var extendedViewport = new CRect(viewport.x-2, viewport.y-2, viewport.width+4, viewport.height+4);
                var pwr = WallRenderer.calculateWalls(MapUtils.currentEntities("wall").value(), extendedViewport, viewers);
                WallRenderer.renderPrecalculatedWallRender(ctx, pwr);
                
                // draw fow background tokens
                var fowClip = FOWRenderer.updateAndGetClip(pwr, extendedViewport);
                if(fowClip != null) {
                    ctx.save();
                    RenderUtils.addPaths(ctx, fowClip);
                    ctx.clip();
                    TokenRenderer.renderTokens(ctx, MapUtils.currentEntitiesSorted("token", Layer.BACKGROUND), StateMain.view.getProfile(), StateMain.highlightToken, true);
                    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
                    ctx.fillRect(extendedViewport.x, extendedViewport.y, extendedViewport.width, extendedViewport.heigth);
                    ctx.restore();
                }
            }
        }
        
        // draw lights
        if(StateMain.view.doRenderLights()) {
            LightRenderer.renderLight(ctx, _g.width, _g.height, camera.getTransform(), viewport, map, viewers);
        }
        
        // render gm overlay tokens
        if(!StateMain.view.isPlayerView()) {
            ctx.globalAlpha = 0.5;
            TokenRenderer.renderTokens(ctx, MapUtils.currentEntitiesSorted("token", Layer.GMOVERLAY), StateMain.view.getProfile(), StateMain.highlightToken, false);
            DrawingRenderer.renderDrawings(ctx, MapUtils.currentEntitiesSorted("drawing", Layer.GMOVERLAY));
            ctx.globalAlpha = 1;
        }
        
        // draw walls as lines
        if(StateMain.view.doRenderWallLines()) {
            ctx.lineWidth = 5;
            MapUtils.currentEntities("wall").forEach(wall => {
                ctx.strokeStyle = wall.prop("seeThrough").getBoolean() ? "lightgray" : "blue";
                ctx.beginPath();
                ctx.moveTo(wall.prop("x1").getLong(), wall.prop("y1").getLong());
                ctx.lineTo(wall.prop("x2").getLong(), wall.prop("y2").getLong());
                ctx.stroke();
            }).value();
            ctx.fillStyle = "rgb(100, 100, 255)";
            MapUtils.currentEntities("wall").forEach(wall => {
                ctx.fillRect(wall.prop("x1").getLong()-5, wall.prop("y1").getLong()-5, 10, 10);
                ctx.fillRect(wall.prop("x2").getLong()-5, wall.prop("y2").getLong()-5, 10, 10);
            }).value();
        }
        
        //TODO: EffectRenderer
        
        //TODO: draw overlay
        
        ctx.restore();
    }
}
