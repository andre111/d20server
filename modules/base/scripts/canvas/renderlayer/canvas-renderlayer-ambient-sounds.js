class CanvasRenderLayerAmbientSounds extends CanvasRenderLayer {
    constructor() {
        super();
    }
    
    render(ctx, view, viewers, camera, viewport, map) {
        // find listener
        var listener = null;
        var listenerDist = 0;
        var listenerX = 0;
        var listenerY = 0;
        for(var viewer of viewers) {
            var dist = (viewer.prop("x").getLong() - camera.getX()) * (viewer.prop("x").getLong() - camera.getX()) + (viewer.prop("y").getLong() - camera.getY()) * (viewer.prop("y").getLong() - camera.getY());
            if(listener == null || dist < listenerDist) {
                listener = viewer;
                listenerDist = dist;
                listenerX = viewer.prop("x").getLong();
                listenerY = viewer.prop("y").getLong();
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
