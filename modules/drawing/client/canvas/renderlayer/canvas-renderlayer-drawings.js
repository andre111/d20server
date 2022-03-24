// @ts-check
import { CanvasRenderLayer } from '../../../../../core/client/canvas/canvas-renderlayer.js';
import { MapUtils } from '../../../../../core/client/util/maputil.js';
import { DrawingRenderer } from '../../renderer/drawing-renderer.js';

export class CanvasRenderLayerDrawings extends CanvasRenderLayer {
    constructor(level, layer, alpha, requireGM) {
        super();

        this.level = level;
        this.layer = layer;
        this.alpha = alpha;
        this.requireGM = requireGM;
    }

    render(ctx, state, view, viewers, camera, viewport, map) {
        if (this.requireGM && view.isPlayerView()) return;
        if (this.alpha && this.alpha != 1) ctx.globalAlpha = this.alpha;
        DrawingRenderer.renderDrawings(ctx, MapUtils.currentEntitiesSorted('drawing', this.layer));
        if (this.alpha && this.alpha != 1) ctx.globalAlpha = 1;
    }

    getLevel() {
        return this.level;
    }
}
