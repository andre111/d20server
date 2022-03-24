// @ts-check
import { MouseController } from '../mouse-controller.js';

export class MouseControllerCamera extends MouseController {
    camera;
    child;
    dragCamera;
    lastMousePos;

    constructor(camera, child) {
        super();

        this.camera = camera;
        this.child = child;
        this.dragCamera = false;
        this.lastMousePos = null;
    }

    onMove(e) {
        if (e.which == 0) {
            this.mouseMoved(e);
        } else {
            this.mouseDragged(e);
        }
    }

    mouseDragged(e) {
        e.preventDefault();
        e.xm = e.offsetX;
        e.ym = e.offsetY;

        var doDrag = this.dragCamera || e.altKey;
        if (doDrag) {
            var mousePos = this.camera.inverseTransform(e.xm, e.ym);
            this.camera.drag(this.lastMousePos.x - mousePos.x, this.lastMousePos.y - mousePos.y);
        }
        this.lastMousePos = this.camera.inverseTransform(e.xm, e.ym);
        if (this.child && !doDrag) this.child.mouseDragged(this.adjustPosition(e));
    }

    mouseMoved(e) {
        e.preventDefault();
        e.xm = e.offsetX;
        e.ym = e.offsetY;

        this.lastMousePos = this.camera.inverseTransform(e.xm, e.ym);
        if (this.child) this.child.mouseMoved(this.adjustPosition(e));
    }

    mouseWheelMoved(e) {
        e.preventDefault();
        e.xm = e.offsetX;
        e.ym = e.offsetY;

        this.camera.zoom(e.deltaY);
        if (this.child) this.child.mouseWheelMoved(this.adjustPosition(e));
    }

    mouseClicked(e) {
        e.preventDefault();
        e.xm = e.offsetX;
        e.ym = e.offsetY;

        if (this.child && !e.altKey) this.child.mouseClicked(this.adjustPosition(e));
    }

    mouseDblClicked(e) {
        e.preventDefault();
        e.xm = e.offsetX;
        e.ym = e.offsetY;

        if (this.child && !e.altKey) this.child.mouseDblClicked(this.adjustPosition(e));
    }

    mousePressed(e) {
        e.preventDefault();
        e.xm = e.offsetX;
        e.ym = e.offsetY;

        if (e.which == 2 || e.altKey) {
            this.dragCamera = true;
        } else {
            if (this.child) this.child.mousePressed(this.adjustPosition(e));
        }
    }

    mouseReleased(e) {
        e.preventDefault();
        e.xm = e.offsetX;
        e.ym = e.offsetY;

        if (e.which == 2 || e.altKey) {
            this.dragCamera = false;
        } else {
            if (this.child) this.child.mouseReleased(this.adjustPosition(e));
        }
    }

    mouseEntered(e) {
        e.preventDefault();
        e.xm = e.offsetX;
        e.ym = e.offsetY;

        if (this.child) this.child.mouseEntered(this.adjustPosition(e));
    }

    mouseExited(e) {
        e.preventDefault();
        e.xm = e.offsetX;
        e.ym = e.offsetY;

        this.dragCamera = false;
        if (this.child) this.child.mouseExited(this.adjustPosition(e));
    }

    adjustPosition(e) {
        var pos = this.camera.inverseTransform(e.xm, e.ym);
        e.xm = pos.x;
        e.ym = pos.y;
        return e;
    }
}
