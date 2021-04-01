import { Events } from '../../common/events.js';

var _seen = null;
var _cpr = new ClipperLib.Clipper();
export const FOWRenderer = {
    reset: function() {
        _seen = null;
    },
    
    updateAndGetClip: function(hiddenArea, viewport) {
        if(hiddenArea == null || hiddenArea == undefined) return null;
        
        var seenArea = FOWRenderer.calculateSeenArea(hiddenArea, viewport);
        if(_seen == null) {
            _seen = seenArea;
        } else {
            var result = new ClipperLib.Paths();
            _cpr.Clear();
            _cpr.AddPaths(_seen, ClipperLib.PolyType.ptSubject, true);
            _cpr.AddPaths(seenArea, ClipperLib.PolyType.ptClip, true);
            _cpr.Execute(ClipperLib.ClipType.ctUnion, result);
            _seen = result;
        }
        
        var clip = new ClipperLib.Paths();
        _cpr.Clear();
        _cpr.AddPaths(_seen, ClipperLib.PolyType.ptSubject, true);
        _cpr.AddPaths(seenArea, ClipperLib.PolyType.ptClip, true);
        _cpr.Execute(ClipperLib.ClipType.ctDifference, clip);
        return clip;
    },
    
    calculateSeenArea: function(hiddenArea, viewport) {
        var seenArea = new ClipperLib.Paths();
        _cpr.Clear();
        _cpr.AddPath(viewport.toPath(), ClipperLib.PolyType.ptSubject, true);
        _cpr.AddPaths(hiddenArea, ClipperLib.PolyType.ptClip, true);
        _cpr.Execute(ClipperLib.ClipType.ctDifference, seenArea);
        return seenArea;
    }
}
Events.on('mapChange', event => FOWRenderer.reset());
Events.on('viewChange', event => FOWRenderer.reset());
