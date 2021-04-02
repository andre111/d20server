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
        if(view.doRenderWallLines()) {
            ctx.lineWidth = 5;
            MapUtils.currentEntities('wall').forEach(wall => {
                if(!wall.prop('door').getBoolean() || !wall.prop('open').getBoolean()) {
                    ctx.strokeStyle = wall.prop('seeThrough').getBoolean() ? 'lightgray' : 'blue';
                    ctx.beginPath();
                    ctx.moveTo(wall.prop('x1').getLong(), wall.prop('y1').getLong());
                    ctx.lineTo(wall.prop('x2').getLong(), wall.prop('y2').getLong());
                    ctx.stroke();
                }
            });
            ctx.fillStyle = 'rgb(100, 100, 255)';
            MapUtils.currentEntities('wall').forEach(wall => {
                ctx.fillRect(wall.prop('x1').getLong()-5, wall.prop('y1').getLong()-5, 10, 10);
                ctx.fillRect(wall.prop('x2').getLong()-5, wall.prop('y2').getLong()-5, 10, 10);
                
                if(wall.prop('door').getBoolean()) {
                    var icon = ImageService.getInternalImage('/core/files/img/'+(wall.prop('locked').getBoolean() ? 'locked.png' : 'unlocked.png'));
                    if(icon != null) {
                        var x = (wall.prop('x1').getLong() + wall.prop('x2').getLong()) / 2;
                        var y = (wall.prop('y1').getLong() + wall.prop('y2').getLong()) / 2;
                        var offset = (wall.prop('locked').getBoolean() ? 0 : 4);
                        
                        ctx.drawImage(icon, x+offset-24/2, y-24/2, 24, 24);
                    }
                }
            });
        }
    }
    
    getLevel() {
        return this.level;
    }
}
