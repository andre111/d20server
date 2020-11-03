class CanvasRenderLayerWeather extends CanvasRenderLayer {
    constructor(level) {
        super();
        
        this.level = level;
    }
    
    render(ctx, view, viewers, camera, viewport, map) {
        WeatherRenderer.updateAndDraw(ctx, viewport, map.prop("effect").getEffect());
    }
    
    getLevel() {
        return this.level;
    }
}
