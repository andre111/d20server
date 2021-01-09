export const RenderUtils = {
    addPaths(ctx, paths) {
        ctx.beginPath();
        for(const path of paths) {
            var first = true;
            for(const point of path) {
                if(first) {
                    ctx.moveTo(point.X, point.Y);
                    first = false;
                } else {
                    ctx.lineTo(point.X, point.Y);
                }
            }
            ctx.closePath();
        }
    }
}
