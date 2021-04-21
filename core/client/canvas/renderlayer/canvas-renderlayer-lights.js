import { CanvasRenderLayer } from '../canvas-renderlayer.js';
import { LightRenderer } from '../../renderer/light-renderer.js';
import { MapUtils } from '../../util/maputil.js';

export class CanvasRenderLayerLights extends CanvasRenderLayer {
    constructor(level) {
        super();
        
        this.level = level;
    }
    
    render(ctx, state, view, viewers, camera, viewport, map) {
        if(view.doRenderLights()) {
            LightRenderer.renderLight(ctx, state.width, state.height, camera.getTransform(), viewport, map, viewers, MapUtils.currentEntities('token'));
        }
    }
    
    getLevel() {
        return this.level;
    }
}
