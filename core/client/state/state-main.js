import { Client } from '../app.js';
import { State } from './state.js';
import { Camera } from '../canvas/camera.js';
import { MouseControllerCamera } from '../canvas/mouse-controller-camera.js';
import { MouseControllerCanvas } from '../canvas/mouse-controller-canvas.js';
import { CanvasModeEntities } from '../canvas/mode/canvas-mode-entities.js';
import { CanvasView } from '../canvas/canvas-view.js';
import { CanvasRenderLayer } from '../canvas/canvas-renderlayer.js';
import { CanvasEntityRenderer } from '../canvas/canvas-entityrenderer.js';
import { SidepanelTab } from '../sidepanel/sidepanel-tab.js';
import { ModePanel } from '../canvas/mode-panel.js';
import { ServerData } from '../server-data.js';
import { MessageService } from '../service/message-service.js';
import { MapUtils } from '../util/maputil.js';

import { Access, Layer } from '../../common/constants.js';
import { Events } from '../../common/events.js';
import { PlayEffect } from '../../common/messages.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { NotificationManager } from '../gui/notification-manager.js';
import { Tabs } from '../gui/tabs.js';

export class StateMain extends State {
    active;
    fpsInterval;
    lastFrame;

    canvas;
    ctx;
    buffer;
    bctx;

    width;
    height;

    camera;
    mcc;
    mode;
    view;
    #layer;

    renderLayers;
    entityRenderers;
    notificationManager;

    mapChangeListener;

    highlightToken;
    viewToken;

    init() {
        // create html elements
        const canvas = document.createElement('canvas');
        canvas.id = 'canvas';
        canvas.tabIndex = '1';
        document.body.appendChild(canvas);

        const sidepanel = document.createElement('div');
        //const sidepanelLinks = document.createElement('ul');
        sidepanel.id = 'sidepanel';
        sidepanel.tabIndex = '2';
        //sidepanel.appendChild(sidepanelLinks);
        document.body.appendChild(sidepanel);

        this.notificationManager = new NotificationManager();
        document.body.appendChild(this.notificationManager.getContainer());
        
        Events.trigger('createMainHTML', {state: this});
        
        // get reference to main canvas
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // create offscreen canvas as a render buffer
        this.buffer = document.createElement('canvas');
        this.bctx = this.buffer.getContext('2d');
        
        // add mouse controller
        this.camera = new Camera();
        this.mcc = new MouseControllerCamera(this.camera, new MouseControllerCanvas(canvas));
        canvas.addEventListener('mousemove', e => this.mcc.onMove(e), true);
        canvas.addEventListener('wheel', e => this.mcc.mouseWheelMoved(e), true);
        canvas.addEventListener('click', e => this.mcc.mouseClicked(e), true);
        canvas.addEventListener('contextmenu', e => { this.mcc.mouseClicked(e); e.preventDefault(); return false; }, true);
        canvas.addEventListener('mousedown', e => this.mcc.mousePressed(e), true);
        canvas.addEventListener('mouseup', e => this.mcc.mouseReleased(e), true);
        canvas.addEventListener('mouseenter', e => this.mcc.mouseEntered(e), true);
        canvas.addEventListener('mouseleave', e => this.mcc.mouseExited(e), true);
        
        //...
        this.#layer = Layer.MAIN;
        this.setMode(new CanvasModeEntities('token', this.#layer));
        if(ServerData.isGM()) {
            this.setView(new CanvasView(ServerData.localProfile, false, false, false, true));
        } else {
            this.setView(new CanvasView(ServerData.localProfile, true, true, true, false));
        }
        this.highlightToken = -1;
        this.viewToken = -1;
        
        this.mapChangeListener = Events.on('mapChange', event => this.onMapChange());
        
        this.modePanel = new ModePanel();
        
        // calculate fps times
        this.fpsInterval = 1000 / Client.FPS;
        this.lastFrame = Date.now();
        
        // start rendering
        this.active = true;
        this.onFrame();
        
        // collect render layers
        this.renderLayers = [];
        var data = {
            addRenderLayer: layer => {
                if(!(layer instanceof CanvasRenderLayer)) throw new Error('Can only add instances of CanvasRenderLayer');
                this.renderLayers.push(layer);
            }
        };
        Events.trigger('addRenderLayers', data);
        this.renderLayers.sort((a, b) => a.getLevel() - b.getLevel());
        
        // collect entity renderers
        this.entityRenderers = {};
        data = {
            addEntityRenderer: (type, renderer) => {
                if(!(renderer instanceof CanvasEntityRenderer)) throw new Error('Can only add instances of CanvasEntityRenderer');
                this.entityRenderers[type] = renderer;
            }
        };
        Events.trigger('addEntityRenderers', data);
        
        // collect tabs
        this.sidepanelTabs = [];
        data = {
            addSidepanelTab: tab => {
                if(!(tab instanceof SidepanelTab)) throw new Error('Can only add instances of SidePanelTab');
                this.sidepanelTabs.push(tab);
            }
        };
        Events.trigger('addSidepanelTabs', data);

        // create tabs
        for(const tab of this.sidepanelTabs) {
            if(tab.isVisible()) {
                // add panel tab
                tab.getTab().name = tab.getName();
                sidepanel.appendChild(tab.getTab());
            }
        }
        Tabs.init(sidepanel);
    }

    exit() {
        //TODO: improve this
        this.active = false;
        Events.remove('mapChange', this.mapChangeListener);
        document.body.innerHTML = '';
    }

    onFrame() {
        if(!this.active) return;
        
        // schedule next frame
        requestAnimationFrame(() => this.onFrame());
        
        // adjust canvas sizes
        this.resize(this.canvas, this.buffer);
        
        // calculate time
        var now = Date.now();
        var elapsed = now - this.lastFrame;
        
        // render frame when at correct time
        if(elapsed > this.fpsInterval) {
            this.lastFrame = now - (elapsed % this.fpsInterval);
            
            Events.trigger('frameStart');
            this.draw(this.ctx);
            this.notificationManager.update();
            Events.trigger('frameEnd');
        }
    }

    resize(canvas, buffer) {
        this.width = canvas.clientWidth;
        this.height = canvas.clientHeight;
        
        // resize canvas and buffer to match display size
        if(canvas.width != this.width || canvas.height != this.height) {
            canvas.width = this.width;
            canvas.height = this.height;
        }
        if(buffer.width != this.width || buffer.height != this.height) {
            buffer.width = this.width;
            buffer.height = this.height;
        }
    }
    
    onMapChange() {
        this.centerCamera(true);
    }

    getHighlightToken() {
        return this.highlightToken;
    }
    
    setHighlightToken(highlightToken) {
        this.highlightToken = highlightToken;
    }

    releaseHighlightToken(highlightToken) {
        if(this.highlightToken == highlightToken) {
            this.highlightToken = -1;
        }
    }

    getViewToken() {
        return this.viewToken;
    }

    setViewToken(viewToken) {
        this.viewToken = viewToken;
    }
    
    centerCamera(instant) {
        const map = MapUtils.currentMap();
        if(!map) return;
        
        var camTargetX = map.prop('width').getLong() * map.prop('gridSize').getLong() / 2;
		var camTargetY = map.prop('height').getLong() * map.prop('gridSize').getLong() / 2;
		
		// find a controlled token to center on
		const controllableTokens = MapUtils.findControllableTokens(this.view.getProfile());
		if(controllableTokens.length > 0) {
			// find index of last token we focused on
			var lastIndex = -1;
			for(var i=0; i<controllableTokens.length; i++) {
				if(controllableTokens[i].id == this.lastCenteredTokenID) {
					lastIndex = i;
				}
			}
			
			// focus on the next one
			var index = (lastIndex + 1) % controllableTokens.length;
			camTargetX = controllableTokens[index].prop('x').getLong();
			camTargetY = controllableTokens[index].prop('y').getLong();
			this.lastCenteredTokenID = controllableTokens[index].id;
		}
		
		this.camera.setLocation(camTargetX, camTargetY, instant);
    }
    
    draw(ctx) {
        ctx.font = '12px arial';
        
        const map = MapUtils.currentMap();
        
        // find viewers
        var viewers = [];
        MapUtils.currentEntities('token').forEach(token => {
            var accessLevel = token.getAccessLevel(this.view.getProfile());
            if(Access.matches(token.prop('sharedVision').getAccessValue(), accessLevel)) {
                viewers.push(token);
            }
        });
        // ...which are potentially overridden
        var forceWallOcclusion = false;
        if(this.viewToken > 0) {
            var forcedViewer = EntityManagers.get('token').find(this.viewToken);
            if(forcedViewer && (ServerData.isGM() || viewers.includes(forcedViewer))) {
                viewers = [forcedViewer];
                forceWallOcclusion = true;
            }
        }
        
        //
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.rect(0, 0, this.width, this.height);
        ctx.fill();
        ctx.closePath();
        if(!map || !this.view || (viewers.length == 0 && map.prop('hideWithNoMainToken').getBoolean() && this.view.isPlayerView())) {
            return;
        }
        this.view.setForceWallOcclusion(forceWallOcclusion);
        
        // update and apply camera
        this.camera.update(this.width, this.height);
        var viewport = this.camera.getViewport();
        ctx.save();
        ctx.setTransform(this.camera.getTransform());
        
        // draw render layers
        for(const layer of this.renderLayers) {
            layer.render(ctx, this, this.view, viewers, this.camera, viewport, map);
        }
        
        // draw overlay
        if(this.mode) this.mode.renderOverlay(ctx);
        
        ctx.restore();
    }

    mouseDragged(e) {
        this.mouseX = e.xm;
        this.mouseY = e.ym;
        if(this.mode) this.mode.mouseDragged(e);
    }

    mouseMoved(e) {
        this.mouseX = e.xm;
        this.mouseY = e.ym;
        if(this.mode) this.mode.mouseMoved(e);
    }

    mouseWheelMoved(e) {
        if(this.mode) this.mode.mouseWheelMoved(e);
    }

    mouseClicked(e) {
        this.canvas.focus();
        if(this.mode) this.mode.mouseClicked(e);
    }

    mousePressed(e) {
        this.canvas.focus();
        this.viewToken = -1;
        if(this.mode) this.mode.mousePressed(e);
    }

    mouseReleased(e) {
        if(this.mode) this.mode.mouseReleased(e);
    }

    mouseEntered(e) {
        this.highlightToken = -1;
        if(this.mode) this.mode.mouseEntered(e);
    }

    mouseExited(e) {
        if(this.mode) this.mode.mouseExited(e);
    }

    actionPerformed(action) {
        var pcolor = '#' + (ServerData.localProfile.getColor() & 0x00FFFFFF).toString(16).padStart(6, '0');
        if(action == 'center_camera') this.centerCamera(false);
        if(action == 'ping_location') MessageService.send(new PlayEffect('PING', this.mouseX, this.mouseY, 0, 1, true, false, [pcolor]));
        if(action == 'ping_location_focus') MessageService.send(new PlayEffect('PING', this.mouseX, this.mouseY, 0, 1, true, true, [pcolor]));
        //TODO: if(action == 'toggle_mode_window') ...
        //TODO: if(action == 'toggle_side_pane') ...
        if(this.mode) this.mode.actionPerformed(action);
    }

    getMode() {
        return this.mode;
    }

    setMode(mode) {
        if(this.mode) this.mode.exit();
        this.mode = mode;
        this.mode.init();
    }

    getView() {
        return this.view;
    }

    setView(view) {
        const data = {
            oldView: this.view,
            newView: view
        };
        Events.trigger('viewChange', data);
        this.view = view;
    }

    getLayer() {
        return this.#layer;
    }

    setLayer(layer) {
        this.#layer = layer;
        if(this.mode) this.mode.onLayerChange();
    }

    getCamera() {
        return this.camera;
    }

    getNotificationManager() {
        return this.notificationManager;
    }

    getTab(name) {
        for(const tab of this.sidepanelTabs) {
            if(tab.getName() == name) return tab;
        }
        return null;
    }
}
