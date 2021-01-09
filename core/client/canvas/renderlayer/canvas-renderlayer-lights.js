import { CanvasRenderLayer } from '../canvas-renderlayer.js';
import { LightRenderer } from '../../renderer/light-renderer.js';

export class CanvasRenderLayerLights extends CanvasRenderLayer {
    constructor(level) {
        super();
        
        this.level = level;
    }
    
    render(ctx, state, view, viewers, camera, viewport, map) {
        if(view.doRenderLights()) {
            LightRenderer.renderLight(ctx, state.width, state.height, camera.getTransform(), viewport, map, viewers);
        }
    }
    
    getLevel() {
        return this.level;
    }
}
