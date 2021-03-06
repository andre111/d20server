// @ts-check
import { Client } from '../client.js';
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
import { CanvasWindowManager } from '../canvas/canvas-window-manager.js';
import { ControllsBar } from '../gui/controlls-bar.js';

export class StateMain extends State {
    active;
    fpsInterval;
    lastFrame;

    canvas;
    ctx;

    width;
    height;

    camera;
    mcc;
    mode;
    view;
    #layer;
    #controllsBar;

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
        canvas.tabIndex = 1;
        document.body.appendChild(canvas);

        const sidepanel = document.createElement('div');
        sidepanel.id = 'sidepanel';
        sidepanel.tabIndex = 2;
        document.body.appendChild(sidepanel);

        this.notificationManager = new NotificationManager();
        document.body.appendChild(this.notificationManager.getContainer());

        this.#controllsBar = new ControllsBar();

        // add global listener for internal links
        this.internalLinkListener = e => {
            if (e.target.nodeName == 'A' && e.target.className == 'internal-link') {
                if (e.target.closest('.mce-content-body') == null) { // only trigger when not inside an active TinyMCE instance
                    Events.trigger('internalLinkClick', { target: e.target.dataset['target'] }, true);
                }
                e.preventDefault();
            }
        };
        document.body.addEventListener('click', this.internalLinkListener);

        // get reference to main canvas
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });

        // add mouse controller
        this.camera = new Camera();
        this.mcc = new MouseControllerCamera(this.camera, new MouseControllerCanvas(canvas));
        canvas.addEventListener('mousemove', e => this.mcc.onMove(e), true);
        canvas.addEventListener('wheel', e => this.mcc.mouseWheelMoved(e), true);
        canvas.addEventListener('click', e => this.mcc.mouseClicked(e), true);
        canvas.addEventListener('dblclick', e => this.mcc.mouseDblClicked(e), true);
        canvas.addEventListener('contextmenu', e => { this.mcc.mouseClicked(e); e.preventDefault(); return false; }, true);
        canvas.addEventListener('mousedown', e => this.mcc.mousePressed(e), true);
        canvas.addEventListener('mouseup', e => this.mcc.mouseReleased(e), true);
        canvas.addEventListener('mouseenter', e => this.mcc.mouseEntered(e), true);
        canvas.addEventListener('mouseleave', e => this.mcc.mouseExited(e), true);

        //...
        this.#layer = Layer.MAIN;
        this.setMode(new CanvasModeEntities('token'));
        if (ServerData.isGM()) {
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
        Events.trigger('addRenderLayers', {
            addRenderLayer: layer => {
                if (!(layer instanceof CanvasRenderLayer)) throw new Error('Can only add instances of CanvasRenderLayer');
                this.renderLayers.push(layer);
            }
        });
        this.renderLayers.sort((a, b) => a.getLevel() - b.getLevel());

        // collect entity renderers
        this.entityRenderers = {};
        Events.trigger('addEntityRenderers', {
            addEntityRenderer: (type, renderer) => {
                if (!(renderer instanceof CanvasEntityRenderer)) throw new Error('Can only add instances of CanvasEntityRenderer');
                this.entityRenderers[type] = renderer;
            }
        });

        // collect tabs
        this.sidepanelTabs = [];
        Events.trigger('addSidepanelTabs', {
            addSidepanelTab: tab => {
                if (!(tab instanceof SidepanelTab)) throw new Error('Can only add instances of SidePanelTab');
                this.sidepanelTabs.push(tab);
            }
        });

        // create tabs
        for (const tab of this.sidepanelTabs) {
            if (tab.isVisible()) {
                // add panel tab
                tab.tab.dataset.name = tab.getIcon();
                tab.tab.title = tab.getName();
                sidepanel.appendChild(tab.tab);
            }
        }
        Tabs.init(sidepanel);
    }

    exit() {
        //TODO: improve this
        this.active = false;
        Events.remove('mapChange', this.mapChangeListener);
        CanvasWindowManager.closeAll();
        document.body.innerHTML = '';
    }

    onFrame() {
        if (!this.active) return;

        // schedule next frame
        requestAnimationFrame(() => this.onFrame());

        // adjust canvas sizes
        this.resize(this.canvas);

        // calculate time
        var now = Date.now();
        var elapsed = now - this.lastFrame;

        // render frame when at correct time
        if (elapsed > this.fpsInterval) {
            this.lastFrame = now - (elapsed % this.fpsInterval);

            Events.trigger('frameStart');
            this.draw(this.ctx);
            this.notificationManager.update();
            Events.trigger('frameEnd');
        }
    }

    resize(canvas) {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // resize canvas to match display size
        if (canvas.width != this.width || canvas.height != this.height) {
            canvas.width = this.width;
            canvas.height = this.height;
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
        if (this.highlightToken == highlightToken) {
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
        if (!map) return;

        var camTargetX = map.getLong('width') * map.getLong('gridSize') / 2;
        var camTargetY = map.getLong('height') * map.getLong('gridSize') / 2;

        // find a controlled token to center on
        const controllableTokens = MapUtils.findControllableTokens(this.view.getProfile());
        if (controllableTokens.length > 0) {
            // find index of last token we focused on
            var lastIndex = -1;
            for (var i = 0; i < controllableTokens.length; i++) {
                if (controllableTokens[i].id == this.lastCenteredTokenID) {
                    lastIndex = i;
                }
            }

            // focus on the next one
            var index = (lastIndex + 1) % controllableTokens.length;
            camTargetX = controllableTokens[index].getLong('x');
            camTargetY = controllableTokens[index].getLong('y');
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
            const accessLevel = token.getAccessLevel(this.view.getProfile());
            if (Access.matches(Access.CONTROLLING_PLAYER, accessLevel)) {
                viewers.push(token);
            }
        });
        // ...which are potentially overridden
        var forceNormalLimitedView = false;
        if (this.viewToken > 0) {
            const forcedViewer = MapUtils.currentEntities('token').find(t => t.getID() == this.viewToken);
            if (forcedViewer && (ServerData.isGM() || viewers.includes(forcedViewer))) {
                viewers = [forcedViewer];
                forceNormalLimitedView = true;
            }
        }

        //
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.rect(0, 0, this.width, this.height);
        ctx.fill();
        ctx.closePath();
        if (!map || !this.view || (viewers.length == 0 && this.view.isPlayerView())) {
            return;
        }
        this.view.setForceWallOcclusion(forceNormalLimitedView);
        this.view.setForceLights(forceNormalLimitedView);

        // update and apply camera
        this.camera.update(this.width, this.height);
        var viewport = this.camera.getViewport();
        ctx.save();
        ctx.setTransform(this.camera.getTransform());

        // draw render layers
        for (const layer of this.renderLayers) {
            layer.render(ctx, this, this.view, viewers, this.camera, viewport, map);
        }

        // draw overlay
        if (this.mode) this.mode.renderOverlay(ctx);

        ctx.restore();
    }

    mouseDragged(e) {
        this.mouseX = e.xm;
        this.mouseY = e.ym;
        if (this.mode) this.mode.mouseDragged(e);
    }

    mouseMoved(e) {
        this.mouseX = e.xm;
        this.mouseY = e.ym;
        if (this.mode) this.mode.mouseMoved(e);
    }

    mouseWheelMoved(e) {
        if (this.mode) this.mode.mouseWheelMoved(e);
    }

    mouseClicked(e) {
        this.canvas.focus();
        if (this.mode) this.mode.mouseClicked(e);
    }

    mouseDblClicked(e) {
        this.canvas.focus();
        if (this.mode) this.mode.mouseDblClicked(e);
    }

    mousePressed(e) {
        this.canvas.focus();
        this.viewToken = -1;
        if (this.mode) this.mode.mousePressed(e);
    }

    mouseReleased(e) {
        if (this.mode) this.mode.mouseReleased(e);
    }

    mouseEntered(e) {
        this.highlightToken = -1;
        if (this.mode) this.mode.mouseEntered(e);
    }

    mouseExited(e) {
        if (this.mode) this.mode.mouseExited(e);
    }

    actionPerformed(action) {
        var pcolor = '#' + (ServerData.localProfile.getColor() & 0x00FFFFFF).toString(16).padStart(6, '0');
        if (action == 'center_camera') this.centerCamera(false);
        if (action == 'ping_location') MessageService.send(new PlayEffect('PING', this.mouseX, this.mouseY, 0, 1, true, false, [pcolor]));
        if (action == 'ping_location_focus') MessageService.send(new PlayEffect('PING', this.mouseX, this.mouseY, 0, 1, true, true, [pcolor]));
        //TODO: if(action == 'toggle_mode_window') ...
        //TODO: if(action == 'toggle_side_pane') ...
        if (this.mode) this.mode.actionPerformed(action);
    }

    getMode() {
        return this.mode;
    }

    setMode(mode) {
        // exit current mode and reset controll hints
        if (this.mode) this.mode.exit();
        this.setControllHints([]);

        // enter new mode
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
        if (this.mode) this.mode.onLayerChange();
    }

    get controllsBar() {
        return this.#controllsBar;
    }

    setControllHints(hints) {
        this.#controllsBar.clearHints();

        for (var i = 0; i < hints.length; i += 2) {
            this.#controllsBar.addHint(hints[i], hints[i + 1]);
        }

        // add standard camera hints
        this.#controllsBar.addHint([['mouse-middle'], ['mouse-left', 'key-Alt']], 'controlls.camera.move');
        this.#controllsBar.addHint('mouse-middle', 'controlls.camera.zoom');
        this.#controllsBar.addHint('key-C', 'controlls.camera.center');
    }

    getCamera() {
        return this.camera;
    }

    getNotificationManager() {
        return this.notificationManager;
    }

    getTab(name) {
        for (const tab of this.sidepanelTabs) {
            if (tab.getName() == name) return tab;
        }
        return null;
    }
}
