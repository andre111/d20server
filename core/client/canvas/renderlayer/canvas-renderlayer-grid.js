import { CanvasRenderLayer } from '../canvas-renderlayer.js';

export class CanvasRenderLayerGrid extends CanvasRenderLayer {
    constructor(level) {
        super();
        
        this.level = level;
    }
    
    render(ctx, state, view, viewers, camera, viewport, map) {
        const gridSize = map.getLong('gridSize');
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.39)';
        for(var x = 0; x <= map.getLong('width'); x++) {
            ctx.beginPath();
            ctx.moveTo(x * gridSize, 0 * gridSize);
            ctx.lineTo(x * gridSize, map.getLong('height') * gridSize);
            ctx.stroke();
        }
        for(var y = 0; y <= map.getLong('height'); y++) {
            ctx.beginPath();
            ctx.moveTo(0 * gridSize, y * gridSize);
            ctx.lineTo(map.getLong('width') * gridSize, y * gridSize);
            ctx.stroke();
        }
    }
    
    getLevel() {
        return this.level;
    }
}
