StateMain = {
    init: function() {
        // create base elements
        var canvas = document.createElement("canvas");
        canvas.id = "canvas";
        canvas.tabIndex = "1";
        document.body.appendChild(canvas);
        var sidepanel = document.createElement("div");
        sidepanel.id = "sidepanel";
        sidepanel.tabIndex = "2";
        sidepanel.appendChild(document.createElement("ul"));
        document.body.appendChild(sidepanel);
        
        //TODO: ...
        // get reference to main canvas
        _g.canvas = document.getElementById("canvas");
        _g.ctx = _g.canvas.getContext("2d");
        
        // create offscreen canvas as a render buffer
        _g.buffer = document.createElement("canvas");
        _g.bctx = _g.buffer.getContext("2d");
        
        // add mouse controller
        var mcc = new MouseCameraContoller(camera, new MouseCanvasController(canvas));
        canvas.addEventListener("mousemove", e => mcc.onMove(e), true);
        canvas.addEventListener("wheel", e => mcc.mouseWheelMoved(e), true);
        canvas.addEventListener("click", e => mcc.mouseClicked(e), true);
        canvas.addEventListener("contextmenu", e => { mcc.mouseClicked(e); e.preventDefault(); return false; }, true);
        canvas.addEventListener("mousedown", e => mcc.mousePressed(e), true);
        canvas.addEventListener("mouseup", e => mcc.mouseReleased(e), true);
        canvas.addEventListener("mouseenter", e => mcc.mouseEntered(e), true);
        canvas.addEventListener("mouseleave", e => mcc.mouseExited(e), true);
        
        //...
        ServerData.currentMap.addObserver(StateMain.onMapChange);
        StateMain.mode = new CanvasModeEntities("token", Layer.MAIN);
        if(ServerData.isGM()) {
            StateMain.view = new CanvasView(ServerData.localProfile, false, false, false, true);
        } else {
            StateMain.view = new CanvasView(ServerData.localProfile, true, true, true, false);
        }
        StateMain.highlightToken = -1;
        StateMain.viewToken = -1;
        
        StateMain.modePanel = new ModePanel();
        
        // calculate fps times
        _g.fpsInterval = 1000 / 30;
        _g.lastFrame = Date.now();
        
        // start rendering
        StateMain.onFrame();
        
        //TODO: remove test stuff
        //var dialog = WindowManager.createWindow("Modal Test", true);
        //dialog.appendChild(document.createTextNode("Jetzt auch mit Testinhalt!"));
        
        //dialog = WindowManager.createWindow("Test 2", false);
        //dialog.appendChild(document.createTextNode("Jetzt auch mit mehr Testinhalt!"));
        
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
        
        //TODO: remove test stuff
        tab.style.height = "800px";
        _g.testTree = new SearchableIDTree(tab, "test-tree", actor => {
            if(actor == null || actor == undefined) return null;
            
            var token = EntityManagers.get("token").find(actor.prop("defaultToken").getLong());
            if(token != null && token != undefined) {
                if(token.prop("imageID").getLong() > 0) {
                    return "/image/"+token.prop("imageID").getLong();
                }
            }
            return "/public/img/gui/x_empty.png";
        }, actor => { return "Hier ist ein langer Beispieltext, der eine kurze Beschreibung eines Zaubers simulieren soll"; });
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
    
    lastCenteredTokenID: -1,
    
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
        ctx.font = "12px arial";
        
        var map = MapUtils.currentMap();
        
        // find viewers
        var viewers = [];
        MapUtils.currentEntities("token").forEach(token => {
            var accessLevel = token.getAccessLevel(StateMain.view.getProfile());
            if(Access.matches(token.prop("sharedVision").getAccessValue(), accessLevel)) {
                viewers.push(token);
            }
        }).value();
        // ...which are potentially overridden
        var forceWallOcclusion = false;
        if(StateMain.viewToken > 0) {
            var forcedViewer = EntityManagers.get("token").find(StateMain.viewToken);
            if(forcedViewer != null && forcedViewer != undefined && (ServerData.isGM() || viewers.includes(forcedViewer))) {
                viewers = [forcedViewer];
                forceWallOcclusion = true;
            }
        }
        
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
            ctx.lineTo(x * gridSize, map.prop("height").getLong() * gridSize);
            ctx.stroke();
        }
        for(y = 0; y <= map.prop("height").getLong(); y++) {
            ctx.beginPath();
            ctx.moveTo(0 * gridSize, y * gridSize);
            ctx.lineTo(map.prop("width").getLong() * gridSize, y * gridSize);
            ctx.stroke();
        }
        
        // draw main tokens
        TokenRenderer.renderTokens(ctx, MapUtils.currentEntitiesSorted("token", Layer.MAIN), StateMain.view.getProfile(), StateMain.highlightToken, false);
        DrawingRenderer.renderDrawings(ctx, MapUtils.currentEntitiesSorted("drawing", Layer.MAIN));
        
        EffectRenderer.updateAndDrawEffects(ctx);
        WeatherRenderer.updateAndDraw(ctx, viewport, map.prop("effect").getEffect());
        
        // draw wall occlusion / fow background
        if(StateMain.view.doRenderWallOcclusion() || forceWallOcclusion) {
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
        
        EffectRenderer.updateAndDrawAboveEffects(ctx);
        
        // draw overlay
        if(StateMain.mode != null) StateMain.mode.renderOverlay(ctx);
        
        ctx.restore();
    }
}
