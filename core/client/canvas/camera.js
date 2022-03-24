// @ts-check
import { Rect } from '../../common/util/rect.js';

// @ts-ignore
let { scale, translate, compose, inverse, applyToPoint } = window.TransformationMatrix;

export class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.scale = 1;

        this.xTarget = 0;
        this.yTarget = 0;

        this.screenWidth = 1920;
        this.screenHeight = 1080;

        this.minScale = 0.2;
        this.maxScale = 2;
    }

    update(screenWidth, screenHeight) {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;

        this.x = this.x + (this.xTarget - this.x) * 0.2;
        this.y = this.y + (this.yTarget - this.y) * 0.2;
    }

    getTransform() {
        return compose(
            translate(this.screenWidth / 2, this.screenHeight / 2),
            scale(this.scale, this.scale),
            translate(-this.x, -this.y)
        );
    }

    getViewport() {
        var w = Math.ceil(this.screenWidth / this.scale);
        var h = Math.ceil(this.screenHeight / this.scale);
        return new Rect(this.x - w / 2, this.y - h / 2, w, h);
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }

    inverseTransform(x, y) {
        return applyToPoint(inverse(this.getTransform()), { x: x, y: y });
    }

    setLocation(x, y, instant) {
        this.xTarget = x;
        this.yTarget = y;
        if (instant) {
            this.x = x;
            this.y = y;
        }
    }

    drag(xd, yd) {
        this.setLocation(this.x + xd, this.y + yd, true);
    }

    zoom(dir) {
        if (dir > 0) {
            this.scale *= 0.9;
        } else {
            this.scale /= 0.9;
        }
        this.scale = Math.max(this.minScale, Math.min(this.scale, this.maxScale));
    }
}
