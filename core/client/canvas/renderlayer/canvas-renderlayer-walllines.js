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
                    // draw basic line
                    ctx.strokeStyle = wall.prop('seeThrough').getBoolean() ? 'lightgray' : 'blue';
                    ctx.beginPath();
                    ctx.moveTo(wall.prop('x1').getLong(), wall.prop('y1').getLong());
                    ctx.lineTo(wall.prop('x2').getLong(), wall.prop('y2').getLong());
                    ctx.stroke();

                    // draw second line for one sided walls
                    if(wall.prop('oneSided').getBoolean()) {
                        const angle = Math.atan2(wall.prop('y2').getLong()-wall.prop('y1').getLong(), wall.prop('x2').getLong()-wall.prop('x1').getLong());
                        const xOffset = Math.cos(angle + Math.PI/2) * 1;
                        const yOffset = Math.sin(angle + Math.PI/2) * 1;

                        ctx.strokeStyle = 'lightgray';
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.moveTo(wall.prop('x1').getLong()+xOffset, wall.prop('y1').getLong()+yOffset);
                        ctx.lineTo(wall.prop('x2').getLong()+xOffset, wall.prop('y2').getLong()+yOffset);
                        ctx.stroke();
                        ctx.lineWidth = 5;
                    }
                }
            });
            ctx.fillStyle = 'rgb(100, 100, 255)';
            MapUtils.currentEntities('wall').forEach(wall => {
                // draw end points
                ctx.fillRect(wall.prop('x1').getLong()-5, wall.prop('y1').getLong()-5, 10, 10);
                ctx.fillRect(wall.prop('x2').getLong()-5, wall.prop('y2').getLong()-5, 10, 10);
                
                // draw door lock icon
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
