import { CanvasRenderLayer } from '../canvas-renderlayer.js';

export class CanvasRenderLayerBG extends CanvasRenderLayer {
    constructor(level) {
        super();

        this.level = level;
    }

    render(ctx, state, view, viewers, camera, viewport, map) {
        const gridSize = map.getLong('gridSize');

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.rect(0, 0, map.getLong('width') * gridSize, map.getLong('height') * gridSize);
        ctx.fill();
        ctx.closePath();
    }

    getLevel() {
        return this.level;
    }
}
