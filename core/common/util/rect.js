// @ts-check
export class Rect {
    constructor(x, y, width, height) {
        this.x = Math.trunc(x);
        this.y = Math.trunc(y);
        this.width = Math.trunc(width);
        this.height = Math.trunc(height);
    }

    toPath() {
        var path = [];
        path.push({ X: this.x, Y: this.y });
        path.push({ X: this.x + this.width, Y: this.y });
        path.push({ X: this.x + this.width, Y: this.y + this.height });
        path.push({ X: this.x, Y: this.y + this.height });
        return path;
    }

    contains(other) {
        if (other.x < this.x) return false;
        if (other.y < this.y) return false;
        if (other.x + other.width > this.x + this.width) return false;
        if (other.y + other.height > this.y + this.height) return false;
        return true;
    }
}
