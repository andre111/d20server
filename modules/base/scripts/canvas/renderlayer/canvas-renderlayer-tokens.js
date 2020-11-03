class CanvasRenderLayerTokens extends CanvasRenderLayer {
    constructor(level, layer, grayscale, alpha, requireGM) {
        super();
        
        this.level = level;
        this.layer = layer;
        this.grayscale = grayscale;
        this.alpha = alpha;
        this.requireGM = requireGM;
    }
    
    render(ctx, view, viewers, camera, viewport, map) {
        if(this.requireGM && view.isPlayerView()) return;
        if(this.alpha && this.alpha != 1) ctx.globalAlpha = this.alpha;
        TokenRenderer.renderTokens(ctx, MapUtils.currentEntitiesSorted("token", this.layer), view.getProfile(), StateMain.highlightToken, this.grayscale);
        if(this.alpha && this.alpha != 1) ctx.globalAlpha = 1;
    }
    
    getLevel() {
        return this.level;
    }
}
