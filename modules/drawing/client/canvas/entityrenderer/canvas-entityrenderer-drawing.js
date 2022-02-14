import { CanvasEntityRenderer } from '../../../../../core/client/canvas/canvas-entityrenderer.js';
import { DrawingRenderer } from '../../renderer/drawing-renderer.js';

export class CanvasEntityRendererDrawing extends CanvasEntityRenderer {
    constructor() {
        super();
    }

    render(ctx, view, entity) {
        DrawingRenderer.renderDrawing(ctx, entity);
    }
}
