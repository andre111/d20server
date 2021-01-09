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
        path.push({ X: this.x+this.width, Y: this.y });
        path.push({ X: this.x+this.width, Y: this.y+this.height });
        path.push({ X: this.x, Y: this.y+this.height });
        return path;
    }
}
