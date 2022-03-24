// @ts-check
import { AmbientAudio } from '../../ambient-audio.js';

import { CanvasRenderLayer } from '../../../../../core/client/canvas/canvas-renderlayer.js';

export class CanvasRenderLayerAmbientSounds extends CanvasRenderLayer {
    constructor() {
        super();
    }

    render(ctx, state, view, viewers, camera, viewport, map) {
        // find listener
        var listener = null;
        var listenerDist = 0;
        var listenerX = 0;
        var listenerY = 0;
        for (const viewer of viewers) {
            const dist = (viewer.getLong('x') - camera.getX()) * (viewer.getLong('x') - camera.getX()) + (viewer.getLong('y') - camera.getY()) * (viewer.getLong('y') - camera.getY());
            if (listener == null || dist < listenerDist) {
                listener = viewer;
                listenerDist = dist;
                listenerX = viewer.getLong('x');
                listenerY = viewer.getLong('y');
            }
        }

        //TODO: calculate listenerZ from camera zoom level?

        // update ambient audio system
        AmbientAudio.update(listener != null, listenerX, listenerY, 0);
    }

    getLevel() {
        return -1;
    }
}
