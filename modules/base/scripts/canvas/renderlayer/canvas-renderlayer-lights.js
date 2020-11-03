class CanvasRenderLayerLights extends CanvasRenderLayer {
    constructor(level) {
        super();
        
        this.level = level;
    }
    
    render(ctx, view, viewers, camera, viewport, map) {
        if(view.doRenderLights()) {
            LightRenderer.renderLight(ctx, _g.width, _g.height, camera.getTransform(), viewport, map, viewers);
        }
    }
    
    getLevel() {
        return this.level;
    }
}
