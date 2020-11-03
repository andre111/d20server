class CanvasEntityRendererDrawing extends CanvasEntityRenderer {
    constructor() {
        super();
    }
    
    render(ctx, view, entity) {
        DrawingRenderer.renderDrawing(ctx, entity);
    }
}
