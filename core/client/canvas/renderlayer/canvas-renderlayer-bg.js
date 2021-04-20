import { CanvasRenderLayer } from '../canvas-renderlayer.js';

export class CanvasRenderLayerBG extends CanvasRenderLayer {
    constructor(level) {
        super();
        
        this.level = level;
    }
    
    render(ctx, state, view, viewers, camera, viewport, map) {
        const gridSize = map.prop('gridSize').getLong();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.rect(0, 0, map.prop('width').getLong() * gridSize, map.prop('height').getLong() * gridSize);
        ctx.fill();
        ctx.closePath();
    }
    
    getLevel() {
        return this.level;
    }
}
