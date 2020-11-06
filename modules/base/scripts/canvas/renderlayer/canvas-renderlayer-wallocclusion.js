class CanvasRenderLayerWallOcclusion extends CanvasRenderLayer {
    constructor(level) {
        super();
        
        this.level = level;
    }
    
    render(ctx, view, viewers, camera, viewport, map) {
        // draw wall occlusion / fow background
        if(view.doRenderWallOcclusion()) {
            // render
            if(viewers.length != 0) {
                // extend viewport to avoid rounding errors
                var extendedViewport = new CRect(viewport.x-2, viewport.y-2, viewport.width+4, viewport.height+4);
                var pwr = WallRenderer.calculateWalls(MapUtils.currentEntities("wall").value(), extendedViewport, viewers);
                WallRenderer.renderPrecalculatedWallRender(ctx, pwr);
                
                // draw fow background tokens
                var fowClip = FOWRenderer.updateAndGetClip(pwr, extendedViewport);
                if(fowClip != null) {
                    ctx.save();
                    RenderUtils.addPaths(ctx, fowClip);
                    ctx.clip();
                    TokenRenderer.renderTokens(ctx, MapUtils.currentEntitiesSorted("token", Layer.BACKGROUND), view.getProfile(), StateMain.highlightToken, true);
                    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
                    ctx.fillRect(extendedViewport.x, extendedViewport.y, extendedViewport.width, extendedViewport.heigth);
                    ctx.restore();
                }
                
                // draw walls as lines
                ctx.lineWidth = 5;
                ctx.lineCap = "round";
                ctx.strokeStyle = "black";
                ctx.beginPath();
                MapUtils.currentEntities("wall").forEach(wall => {
                    if(!wall.prop("seeThrough").getBoolean()) {
                        ctx.moveTo(wall.prop("x1").getLong(), wall.prop("y1").getLong());
                        ctx.lineTo(wall.prop("x2").getLong(), wall.prop("y2").getLong());
                    }
                }).value();
                ctx.stroke();
            }
        }
    }
    
    getLevel() {
        return this.level;
    }
}
