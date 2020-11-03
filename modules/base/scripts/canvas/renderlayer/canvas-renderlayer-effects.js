class CanvasRenderLayerEffects extends CanvasRenderLayer {
    constructor(level, useAboveEffects) {
        super();
        
        this.level = level;
        this.useAboveEffects = useAboveEffects;
    }
    
    render(ctx, view, viewers, camera, viewport, map) {
        if(this.useAboveEffects) {
            EffectRenderer.updateAndDrawAboveEffects(ctx);
        } else {
            EffectRenderer.updateAndDrawEffects(ctx);
        }
    }
    
    getLevel() {
        return this.level;
    }
}
