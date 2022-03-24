// @ts-check
import { CanvasRenderLayer } from '../../../../../core/client/canvas/canvas-renderlayer.js';
import { MapUtils } from '../../../../../core/client/util/maputil.js';

export class CanvasRenderLayerPortals extends CanvasRenderLayer {
    constructor(level) {
        super();

        this.level = level;
    }

    render(ctx, state, view, viewers, camera, viewport, map) {
        //TODO: this should probaby not just reuse this value (but that requires module changes to the view system)
        if (view.doRenderWallLines()) {
            ctx.lineWidth = 5;
            ctx.strokeStyle = 'rgba(255, 100, 255, 0.5)';
            ctx.fillStyle = 'rgba(255, 100, 255, 0.5)';
            MapUtils.currentEntities('portal').forEach(portal => {
                // draw basic line
                ctx.beginPath();
                ctx.moveTo(portal.getLong('x1'), portal.getLong('y1'));
                ctx.lineTo(portal.getLong('x2'), portal.getLong('y2'));
                ctx.stroke();

                // draw end points
                ctx.fillRect(portal.getLong('x1') - 10, portal.getLong('y1') - 10, 20, 20);
                ctx.fillRect(portal.getLong('x2') - 5, portal.getLong('y2') - 5, 10, 10);
            });
        }
    }

    getLevel() {
        return this.level;
    }
}
