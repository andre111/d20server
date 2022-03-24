// @ts-check
export class CanvasRenderLayer {
    constructor() {
    }

    render(ctx, state, view, viewers, camera, viewport, map) { throw new Error('Cannot call abstract function'); }

    getLevel() {
        return 0;
    }
}
