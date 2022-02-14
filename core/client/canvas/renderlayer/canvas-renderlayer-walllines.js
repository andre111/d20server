import { CanvasRenderLayer } from '../canvas-renderlayer.js';
import { MapUtils } from '../../util/maputil.js';
import { ImageService } from '../../service/image-service.js';

export class CanvasRenderLayerWallLines extends CanvasRenderLayer {
    constructor(level) {
        super();

        this.level = level;
    }

    render(ctx, state, view, viewers, camera, viewport, map) {
        // draw walls as lines
        if (view.doRenderWallLines()) {
            ctx.lineWidth = 5;
            MapUtils.currentEntities('wall').forEach(wall => {
                if (!wall.getBoolean('door') || !wall.getBoolean('open')) {
                    // draw basic line
                    ctx.strokeStyle = wall.getBoolean('seeThrough') ? 'lightgray' : 'blue';
                    ctx.beginPath();
                    ctx.moveTo(wall.getLong('x1'), wall.getLong('y1'));
                    ctx.lineTo(wall.getLong('x2'), wall.getLong('y2'));
                    ctx.stroke();

                    // draw second line for one sided walls
                    if (wall.getBoolean('oneSided')) {
                        const angle = Math.atan2(wall.getLong('y2') - wall.getLong('y1'), wall.getLong('x2') - wall.getLong('x1'));
                        const xOffset = Math.cos(angle + Math.PI / 2) * 1;
                        const yOffset = Math.sin(angle + Math.PI / 2) * 1;

                        ctx.strokeStyle = 'lightgray';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.moveTo(wall.getLong('x1') + xOffset, wall.getLong('y1') + yOffset);
                        ctx.lineTo(wall.getLong('x2') + xOffset, wall.getLong('y2') + yOffset);
                        ctx.stroke();
                        ctx.lineWidth = 5;
                    }
                }
            });
            ctx.fillStyle = 'rgb(100, 100, 255)';
            MapUtils.currentEntities('wall').forEach(wall => {
                // draw end points
                ctx.fillRect(wall.getLong('x1') - 5, wall.getLong('y1') - 5, 10, 10);
                ctx.fillRect(wall.getLong('x2') - 5, wall.getLong('y2') - 5, 10, 10);

                // draw door lock icon
                if (wall.getBoolean('door')) {
                    var icon = ImageService.getInternalImage('/core/files/img/' + (wall.getBoolean('locked') ? 'locked.png' : 'unlocked.png'));
                    if (icon != null) {
                        var x = (wall.getLong('x1') + wall.getLong('x2')) / 2;
                        var y = (wall.getLong('y1') + wall.getLong('y2')) / 2;
                        var offset = (wall.getBoolean('locked') ? 0 : 4);

                        ctx.drawImage(icon, x + offset - 24 / 2, y - 24 / 2, 24, 24);
                    }
                }
            });
        }
    }

    getLevel() {
        return this.level;
    }
}
