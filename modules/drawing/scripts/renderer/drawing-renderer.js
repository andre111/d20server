DrawingRenderer = {
    FONT: "32px Arial",
    FONT_BG: "rgba(0, 0, 0, 0.59)",
    
    renderDrawings: function(ctx, drawings) {
        drawings.forEach(d => DrawingRenderer.renderDrawing(ctx, d)).value();
    },
    
    renderDrawing: function(ctx, drawing) {
        var shape = drawing.prop("shape").getString().split(":", 2);
        
        var x = drawing.prop("x").getLong();
        var y = drawing.prop("y").getLong();
        var width = drawing.prop("width").getLong();
        var height = drawing.prop("height").getLong();
        var rotation = drawing.prop("rotation").getDouble();
        var color = drawing.prop("color").getColor();
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation * Math.PI / 180);
        
        switch(shape[0]) {
        case "rect":
            ctx.fillRect(-width/2, -height/2, width, height);
            break;
        case "rectOutline":
            ctx.strokeRect(-width/2, -height/2, width, height);
            break;
        case "oval":
            ctx.beginPath();
            ctx.ellipse(0, 0, width/2, height/2, 0, 0, 2 * Math.PI);
            ctx.fill();
            break;
        case "ovalOutline":
            ctx.beginPath();
            ctx.ellipse(0, 0, width/2, height/2, 0, 0, 2 * Math.PI);
            ctx.stroke();
            break;
        case "text":
            //TODO: Improve how text is handled
            if(shape.length == 2) {
                ctx.fillStyle = DrawingRenderer.FONT_BG;
				ctx.fillRect(-width/2, -height/2, width, height);
                ctx.fillStyle = color;
                ctx.font = DrawingRenderer.FONT;
                ctx.fillText(shape[1], -ctx.measureText(shape[1]).width/2, ctx.measureText(shape[1]).actualBoundingBoxAscent/2);
            }
            break;
        }
        
        ctx.restore();
    },
    
    getTextWidth: function(txt) {
        _g.ctx.save();
        _g.ctx.font = DrawingRenderer.FONT;
        var width = _g.ctx.measureText(txt).width;
        _g.ctx.restore();
        
        return width;
    }
}
