FOWRenderer = {
    _seen: null,
    _cpr: new ClipperLib.Clipper(),
    
    reset: function() {
        FOWRenderer._seen = null;
    },
    
    updateAndGetClip: function(hiddenArea, viewport) {
        if(hiddenArea == null || hiddenArea == undefined) return null;
        
        var seenArea = FOWRenderer.calculateSeenArea(hiddenArea, viewport);
        if(FOWRenderer._seen == null) {
            FOWRenderer._seen = seenArea;
        } else {
            var result = new ClipperLib.Paths();
            FOWRenderer._cpr.Clear();
            FOWRenderer._cpr.AddPaths(FOWRenderer._seen, ClipperLib.PolyType.ptSubject, true);
            FOWRenderer._cpr.AddPaths(seenArea, ClipperLib.PolyType.ptClip, true);
            FOWRenderer._cpr.Execute(ClipperLib.ClipType.ctUnion, result);
            FOWRenderer._seen = result;
        }
        
        var clip = new ClipperLib.Paths();
        FOWRenderer._cpr.Clear();
        FOWRenderer._cpr.AddPaths(FOWRenderer._seen, ClipperLib.PolyType.ptSubject, true);
        FOWRenderer._cpr.AddPaths(seenArea, ClipperLib.PolyType.ptClip, true);
        FOWRenderer._cpr.Execute(ClipperLib.ClipType.ctDifference, clip);
        return clip;
    },
    
    calculateSeenArea: function(hiddenArea, viewport) {
        var seenArea = new ClipperLib.Paths();
        FOWRenderer._cpr.Clear();
        FOWRenderer._cpr.AddPath(viewport.toPath(), ClipperLib.PolyType.ptSubject, true);
        FOWRenderer._cpr.AddPaths(hiddenArea, ClipperLib.PolyType.ptClip, true);
        FOWRenderer._cpr.Execute(ClipperLib.ClipType.ctDifference, seenArea);
        return seenArea;
    }
}
