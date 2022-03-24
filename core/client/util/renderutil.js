// @ts-check
export const RenderUtils = {
    addPaths(ctx, paths) {
        ctx.beginPath();
        for (const path of paths) {
            var first = true;
            for (const point of path) {
                if (first) {
                    ctx.moveTo(point.X, point.Y);
                    first = false;
                } else {
                    ctx.lineTo(point.X, point.Y);
                }
            }
            ctx.closePath();
        }
    },

    grayscale(image) {
        const canvas = document.createElement('canvas');
        const canvasContext = canvas.getContext('2d');

        const imgW = image.width;
        const imgH = image.height;
        canvas.width = imgW;
        canvas.height = imgH;

        canvasContext.drawImage(image, 0, 0);
        var imgPixels = canvasContext.getImageData(0, 0, imgW, imgH);

        for (var y = 0; y < imgPixels.height; y++) {
            for (var x = 0; x < imgPixels.width; x++) {
                const i = (y * 4) * imgPixels.width + x * 4;
                const avg = (imgPixels.data[i] + imgPixels.data[i + 1] + imgPixels.data[i + 2]) / 3;
                imgPixels.data[i] = avg;
                imgPixels.data[i + 1] = avg;
                imgPixels.data[i + 2] = avg;
            }
        }
        canvasContext.putImageData(imgPixels, 0, 0, 0, 0, imgPixels.width, imgPixels.height);
        image.src = canvas.toDataURL();
    },

    getColorImage(color, size, border) {
        const canvas = document.createElement('canvas');
        const canvasContext = canvas.getContext('2d');

        canvas.width = size;
        canvas.height = size;

        canvasContext.fillStyle = color;
        canvasContext.fillRect(border, border, size - border * 2, size - border * 2);

        return canvas.toDataURL();
    }
}
