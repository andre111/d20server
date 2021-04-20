import { CanvasRenderLayer } from '../canvas-renderlayer.js';

export class CanvasRenderLayerGrid extends CanvasRenderLayer {
    constructor(level) {
        super();
        
        this.level = level;
    }
    
    render(ctx, state, view, viewers, camera, viewport, map) {
        const gridSize = map.prop('gridSize').getLong();
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.39)';
        for(var x = 0; x <= map.prop('width').getLong(); x++) {
            ctx.beginPath();
            ctx.moveTo(x * gridSize, 0 * gridSize);
            ctx.lineTo(x * gridSize, map.prop('height').getLong() * gridSize);
            ctx.stroke();
        }
        for(var y = 0; y <= map.prop('height').getLong(); y++) {
            ctx.beginPath();
            ctx.moveTo(0 * gridSize, y * gridSize);
            ctx.lineTo(map.prop('width').getLong() * gridSize, y * gridSize);
            ctx.stroke();
        }
    }
    
    getLevel() {
        return this.level;
    }
}
