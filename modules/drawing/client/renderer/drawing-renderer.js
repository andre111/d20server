// @ts-check
var _lastCTX = null;
export const DrawingRenderer = {
    FONT: '32px Arial',
    FONT_BG: 'rgba(0, 0, 0, 0.59)',

    renderDrawings: function (ctx, drawings) {
        drawings.forEach(d => DrawingRenderer.renderDrawing(ctx, d));
    },

    renderDrawing: function (ctx, drawing) {
        var shape = drawing.getString('shape').split(':', 2);

        var x = drawing.getLong('x');
        var y = drawing.getLong('y');
        var width = drawing.getLong('width');
        var height = drawing.getLong('height');
        var rotation = drawing.getDouble('rotation');
        var color = drawing.getColor('color');
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation * Math.PI / 180);

        switch (shape[0]) {
            case 'rect':
                ctx.fillRect(-width / 2, -height / 2, width, height);
                break;
            case 'rectOutline':
                ctx.strokeRect(-width / 2, -height / 2, width, height);
                break;
            case 'oval':
                ctx.beginPath();
                ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, 2 * Math.PI);
                ctx.fill();
                break;
            case 'ovalOutline':
                ctx.beginPath();
                ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, 2 * Math.PI);
                ctx.stroke();
                break;
            case 'text':
                //TODO: Improve how text is handled
                if (shape.length == 2) {
                    ctx.fillStyle = DrawingRenderer.FONT_BG;
                    ctx.fillRect(-width / 2, -height / 2, width, height);
                    ctx.fillStyle = color;
                    ctx.font = DrawingRenderer.FONT;
                    ctx.fillText(shape[1], -ctx.measureText(shape[1]).width / 2, ctx.measureText(shape[1]).actualBoundingBoxAscent / 2);
                }
                break;
        }

        ctx.restore();
        _lastCTX = ctx;
    },

    getTextWidth: function (txt) {
        if (!_lastCTX) return 0;

        _lastCTX.save();
        _lastCTX.font = DrawingRenderer.FONT;
        var width = _lastCTX.measureText(txt).width;
        _lastCTX.restore();

        return width;
    }
}
