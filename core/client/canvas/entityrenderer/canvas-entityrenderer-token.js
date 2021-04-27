import { CanvasEntityRenderer } from '../canvas-entityrenderer.js';
import { TokenRenderer } from '../../renderer/token-renderer.js';

export class CanvasEntityRendererToken extends CanvasEntityRenderer {
    constructor() {
        super();
    }
    
    render(ctx, view, entity) {
        TokenRenderer.renderToken(ctx, entity, view.getProfile(), entity.getLong('x'), entity.getLong('y'), false);
    }
}
