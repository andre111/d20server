import { CanvasRenderLayer } from '../canvas-renderlayer.js';
import { WeatherRenderer } from '../../renderer/weather-renderer.js';

export class CanvasRenderLayerWeather extends CanvasRenderLayer {
    constructor(level) {
        super();
        
        this.level = level;
    }
    
    render(ctx, state, view, viewers, camera, viewport, map) {
        WeatherRenderer.updateAndDraw(ctx, viewport, map.getEffect('effect'));
    }
    
    getLevel() {
        return this.level;
    }
}
