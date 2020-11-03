class CanvasRenderLayerWallLines extends CanvasRenderLayer {
    constructor(level) {
        super();
        
        this.level = level;
    }
    
    render(ctx, view, viewers, camera, viewport, map) {
        // draw walls as lines
        if(view.doRenderWallLines()) {
            ctx.lineWidth = 5;
            MapUtils.currentEntities("wall").forEach(wall => {
                ctx.strokeStyle = wall.prop("seeThrough").getBoolean() ? "lightgray" : "blue";
                ctx.beginPath();
                ctx.moveTo(wall.prop("x1").getLong(), wall.prop("y1").getLong());
                ctx.lineTo(wall.prop("x2").getLong(), wall.prop("y2").getLong());
                ctx.stroke();
            }).value();
            ctx.fillStyle = "rgb(100, 100, 255)";
            MapUtils.currentEntities("wall").forEach(wall => {
                ctx.fillRect(wall.prop("x1").getLong()-5, wall.prop("y1").getLong()-5, 10, 10);
                ctx.fillRect(wall.prop("x2").getLong()-5, wall.prop("y2").getLong()-5, 10, 10);
            }).value();
        }
    }
    
    getLevel() {
        return this.level;
    }
}
