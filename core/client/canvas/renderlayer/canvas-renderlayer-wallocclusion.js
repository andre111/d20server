import { CanvasRenderLayer } from '../canvas-renderlayer.js';
import { MapUtils } from '../../util/maputil.js';
import { RenderUtils } from '../../util/renderutil.js';
import { WallRenderer } from '../../renderer/wall-renderer.js';
import { FOWRenderer } from '../../renderer/fow-renderer.js';
import { TokenRenderer } from '../../renderer/token-renderer.js';

import { Layer } from '../../../common/constants.js';
import { Rect } from '../../../common/util/rect.js';

export class CanvasRenderLayerWallOcclusion extends CanvasRenderLayer {
    constructor(level) {
        super();
        
        this.level = level;
    }
    
    render(ctx, state, view, viewers, camera, viewport, map) {
        // draw wall occlusion / fow background
        if(view.doRenderWallOcclusion()) {
            // render
            if(viewers.length != 0) {
                // extend viewport to avoid rounding errors
                var extendedViewport = new Rect(viewport.x-4, viewport.y-4, viewport.width+8, viewport.height+8);
                var pwr = WallRenderer.calculateWalls(MapUtils.currentEntities('wall'), extendedViewport, viewers);
                WallRenderer.renderPrecalculatedWallRender(ctx, pwr);
                
                // draw fow background tokens
                var fowClip = FOWRenderer.updateAndGetClip(pwr, viewport);
                if(fowClip != null) {
                    ctx.save();
                    RenderUtils.addPaths(ctx, fowClip);
                    ctx.clip();
                    TokenRenderer.renderTokens(ctx, MapUtils.currentEntitiesSorted('token', Layer.BACKGROUND), view.getProfile(), state.getHighlightToken(), true);
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.fillRect(extendedViewport.x, extendedViewport.y, extendedViewport.width, extendedViewport.heigth);
                    ctx.restore();
                }
                
                // draw walls as lines
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.strokeStyle = 'black';
                ctx.beginPath();
                MapUtils.currentEntities('wall').forEach(wall => {
                    if(wall.prop('seeThrough').getBoolean()) return;
                    if(wall.prop('door').getBoolean() && wall.prop('open').getBoolean()) return;
                    if(wall.prop('oneSided').getBoolean()) return;

                    ctx.moveTo(wall.prop('x1').getLong(), wall.prop('y1').getLong());
                    ctx.lineTo(wall.prop('x2').getLong(), wall.prop('y2').getLong());
                });
                ctx.stroke();
            }
        }
    }
    
    getLevel() {
        return this.level;
    }
}
