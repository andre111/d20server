_g = {
    VERSION: 9
}
ModuleManager.registerModule({
    onEvent: function(type, event) {
        switch(type) {
        case "addModeButtons":
            // token mode
            event.addButton(new ExtendedModeButton(new ModeButton("cursor", "Edit Tokens", () => StateMain.mode instanceof CanvasModeEntities && StateMain.mode.entityType == "token", () => event.panel.setMode(new CanvasModeEntities("token", event.panel.currentLayer))), 0));
            
            // wall mode
            if(ServerData.isGM()) {
                event.addButton(new ExtendedModeButton(new ModeButton("wall", "Edit Walls", () => StateMain.mode instanceof CanvasModeWalls, () => event.panel.setMode(new CanvasModeWalls())), 0));
            }
            break;
        case "addRenderLayers":
            event.addRenderLayer(new CanvasRenderLayerTokens(-1000, Layer.BACKGROUND, false));
            event.addRenderLayer(new CanvasRenderLayerGrid(0));
            event.addRenderLayer(new CanvasRenderLayerTokens(1000, Layer.MAIN, false));
            event.addRenderLayer(new CanvasRenderLayerEffects(1500, false));
            event.addRenderLayer(new CanvasRenderLayerWeather(1600));
            event.addRenderLayer(new CanvasRenderLayerWallOcclusion(1700));
            event.addRenderLayer(new CanvasRenderLayerLights(1800));
            event.addRenderLayer(new CanvasRenderLayerTokens(2000, Layer.GMOVERLAY, false, 0.5, true));
            event.addRenderLayer(new CanvasRenderLayerWallLines(2500));
            event.addRenderLayer(new CanvasRenderLayerEffects(2600, true));
            break;
        case "addEntityRenderers":
            event.addEntityRenderer("token", new CanvasEntityRendererToken());
            break;
        case "addSidepanelTabs":
            new SidepanelTabChat();
            new SidepanelTabPlayers();
            new SidepanelTabActors();
            new SidepanelTabAttachments();
            new SidepanelTabMaps();
            new SidepanelTabImages();
            new SidepanelTabAudio();
            new SidepanelTabLists();
            SidepanelManager.createTab("Settings", "settings");
            break;
        default:
            break;
        }
    }
});

function init() {
    setState(StateInit);
}

function setState(state) {
    if(_g.currentState != null && _g.currentState != undefined) {
        _g.currentState.exit();
    }
    _g.currentState = state;
    _g.currentState.init();
}
