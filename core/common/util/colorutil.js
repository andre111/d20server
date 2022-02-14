export const ColorUtils = {
    randomSaturatedColor: function () {
        const hue = Math.random();
        const saturation = 1;
        const brightness = 1;
        return ColorUtils.HSBtoRGB(hue, saturation, brightness);
    },

    HSBtoRGB: function (hue, saturation, brightness) {
        var r = 0;
        var g = 0;
        var b = 0;

        if (saturation == 0) {
            r = g = b = Math.trunc(brightness * 255 + 0.5);
        } else {
            const h = (hue - Math.floor(hue)) * 6;
            const f = h - Math.floor(h);
            const p = brightness * (1 - saturation);
            const q = brightness * (1 - saturation * f);
            const t = brightness * (1 - (saturation * (1 - f)));

            switch (Math.trunc(h)) {
                case 0:
                    r = Math.trunc(brightness * 255 + 0.5);
                    g = Math.trunc(t * 255 + 0.5);
                    b = Math.trunc(p * 255 + 0.5);
                    break;
                case 1:
                    r = Math.trunc(q * 255 + 0.5);
                    g = Math.trunc(brightness * 255 + 0.5);
                    b = Math.trunc(p * 255 + 0.5);
                    break;
                case 2:
                    r = Math.trunc(p * 255 + 0.5);
                    g = Math.trunc(brightness * 255 + 0.5);
                    b = Math.trunc(t * 255 + 0.5);
                    break;
                case 3:
                    r = Math.trunc(p * 255 + 0.5);
                    g = Math.trunc(q * 255 + 0.5);
                    b = Math.trunc(brightness * 255 + 0.5);
                    break;
                case 4:
                    r = Math.trunc(t * 255 + 0.5);
                    g = Math.trunc(p * 255 + 0.5);
                    b = Math.trunc(brightness * 255 + 0.5);
                    break;
                case 5:
                    r = Math.trunc(brightness * 255 + 0.5);
                    g = Math.trunc(p * 255 + 0.5);
                    b = Math.trunc(q * 255 + 0.5);
                    break;
            }
        }

        return (r << 16) | (g << 8) | (b << 0);
    }
}
