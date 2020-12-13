class CanvasEntityRendererToken extends CanvasEntityRenderer {
    constructor() {
        super();
    }
    
    render(ctx, view, entity) {
        TokenRenderer.renderToken(ctx, entity, view.getProfile(), entity.prop("x").getLong(), entity.prop("y").getLong(), false);
    }
}