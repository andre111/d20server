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
                const walls = MapUtils.currentEntities('wall');

                // extend viewport to avoid rounding errors
                // const extendedViewport = new Rect(viewport.x-4, viewport.y-4, viewport.width+8, viewport.height+8);
                // override viewport to fill the whole map (should no longer be a big performance concern since WallRenderer employs caches)
                const gridSize = map.getLong('gridSize');
                const extendedViewport = new Rect(-4, -4, map.getLong('width')*gridSize+8, map.getLong('height')*gridSize+8);
                const pwr = WallRenderer.calculateWalls(walls, extendedViewport, viewers);
                WallRenderer.renderPrecalculatedWallRender(ctx, pwr);
                
                // draw fow background tokens
                const fowClip = FOWRenderer.updateAndGetClip(pwr, viewport);
                if(fowClip != null) {
                    ctx.save();
                    RenderUtils.addPaths(ctx, fowClip);
                    ctx.clip();
                    TokenRenderer.renderTokens(ctx, MapUtils.currentEntitiesSorted('token', Layer.BACKGROUND), view.getProfile(), state.getHighlightToken(), true, false);
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.fillRect(extendedViewport.x, extendedViewport.y, extendedViewport.width, extendedViewport.heigth);
                    ctx.restore();
                }
                
                // draw walls as lines
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                ctx.strokeStyle = 'black';
                ctx.beginPath();
                for(const wall of walls) {
                    if(wall.getBoolean('seeThrough')) continue;
                    if(wall.getBoolean('door') && wall.getBoolean('open')) continue;
                    if(wall.getBoolean('oneSided')) continue;

                    ctx.moveTo(wall.getLong('x1'), wall.getLong('y1'));
                    ctx.lineTo(wall.getLong('x2'), wall.getLong('y2'));
                }
                ctx.stroke();
            }
        }
    }
    
    getLevel() {
        return this.level;
    }
}
