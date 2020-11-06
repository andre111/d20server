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
        
        Events.trigger("createMainHTML", StateMain);
        
        //TODO: ...
        // get reference to main canvas
        _g.canvas = document.getElementById("canvas");
        _g.ctx = _g.canvas.getContext("2d");
        
        // create offscreen canvas as a render buffer
        _g.buffer = document.createElement("canvas");
        _g.bctx = _g.buffer.getContext("2d");
        
        // add mouse controller
        StateMain.camera = new Camera();
        var mcc = new MouseCameraContoller(StateMain.camera, new MouseCanvasController(canvas));
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
        StateMain.listWindowManager = new CanvasWindowListManager();
        
        // calculate fps times
        _g.fpsInterval = 1000 / _g.FPS;
        _g.lastFrame = Date.now();
        
        // start rendering
        StateMain.onFrame();
        
        // get render layers
        StateMain.renderLayers = [];
        var event = {
            addRenderLayer: layer => {
                if(!(layer instanceof CanvasRenderLayer)) throw "Can only add instances of CanvasRenderLayer";
                StateMain.renderLayers.push(layer);
            }
        };
        Events.trigger("addRenderLayers", event);
        StateMain.renderLayers = _.chain(StateMain.renderLayers).sortBy(layer => layer.getLevel()).value();
        
        // get entity renderers
        StateMain.entityRenderers = {};
        event = {
            addEntityRenderer: (type, renderer) => {
                if(!(renderer instanceof CanvasEntityRenderer)) throw "Can only add instances of CanvasEntityRenderer";
                StateMain.entityRenderers[type] = renderer;
            }
        };
        Events.trigger("addEntityRenderers", event);
        
        // add tabs TODO: add content
        event = {
            addSidepanelTab: tab => {
            }
        };
        Events.trigger("addSidepanelTabs", event);
        SidepanelManager.init();
    },
    
    exit: function() {
        //TODO: improve this
        //TODO: stop calling onFrame!!!
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
            
            Events.trigger("frameStart");
            StateMain.draw();
            Events.trigger("frameEnd");
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
    
    setHighlightToken: function(highlightToken) {
        StateMain.highlightToken = highlightToken;
    },
    releaseHighlightToken: function(highlightToken) {
        if(StateMain.highlightToken == highlightToken) {
            StateMain.highlightToken = -1;
        }
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
		
		StateMain.camera.setLocation(camTargetX, camTargetY, instant);
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
        if(map == null || map == undefined || StateMain.view == null || StateMain.view == undefined || (viewers.length == 0 && map.prop("hideWithNoMainToken").getBoolean() && StateMain.view.isPlayerView())) {
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.rect(0, 0, _g.width, _g.height);
            ctx.fill();
            ctx.closePath();
            return;
        }
        StateMain.view.setForceWallOcclusion(forceWallOcclusion);
        
        StateMain.camera.update();
        var viewport = StateMain.camera.getViewport();
        ctx.save();
        ctx.setTransform(StateMain.camera.getTransform());
        
        // draw render layers
        for(var layer of StateMain.renderLayers) {
            layer.render(ctx, StateMain.view, viewers, StateMain.camera, viewport, map);
        }
        
        // draw overlay
        if(StateMain.mode != null) StateMain.mode.renderOverlay(ctx);
        
        ctx.restore();
    }
}
