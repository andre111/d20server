// @ts-check
export class CanvasWindowManager {
    static #windows = [];
    static #init = false;

    static #dragged = null;
    static #draggedX;
    static #draggedY;

    static onWindowOpen(w) {
        if (!CanvasWindowManager.#init) {
            CanvasWindowManager.#init = true;
            document.addEventListener('mousemove', e => {
                if (CanvasWindowManager.#dragged) {
                    var x = (e.clientX - CanvasWindowManager.#draggedX);
                    var y = (e.clientY - CanvasWindowManager.#draggedY);

                    if (x + CanvasWindowManager.#dragged.frame.offsetWidth > document.body.clientWidth) x = document.body.clientWidth - CanvasWindowManager.#dragged.frame.offsetWidth;
                    if (y + CanvasWindowManager.#dragged.frame.offsetHeight > document.body.clientHeight) y = document.body.clientHeight - CanvasWindowManager.#dragged.frame.offsetHeight;
                    if (x < 0) x = 0;
                    if (y < 0) y = 0;

                    CanvasWindowManager.#dragged.frame.style.left = x + 'px';
                    CanvasWindowManager.#dragged.frame.style.top = y + 'px';
                }
            });
            document.addEventListener('mouseup', e => {
                CanvasWindowManager.#dragged = null;
            });
            window.addEventListener("beforeunload", e => {
                CanvasWindowManager.closeAll();
            });
        }

        CanvasWindowManager.#windows.push(w);
    }

    static closeAll() {
        for (var i = CanvasWindowManager.#windows.length - 1; i >= 0; i--) {
            CanvasWindowManager.#windows[i].close();
        }
    }

    static onWindowClose(w) {
        const index = CanvasWindowManager.#windows.indexOf(w);
        if (index >= 0) CanvasWindowManager.#windows.splice(index, 1);
    }

    static dragInit(w, x, y) {
        CanvasWindowManager.#dragged = w;
        CanvasWindowManager.#draggedX = x - w.frame.offsetLeft;
        CanvasWindowManager.#draggedY = y - w.frame.offsetTop;
        return false;
    }

    static getMaxZIndex() {
        var maxZIndex = 100;
        for (const w of CanvasWindowManager.#windows) {
            maxZIndex = Math.max(maxZIndex, w.zIndex);
        }
        return maxZIndex;
    }
}
