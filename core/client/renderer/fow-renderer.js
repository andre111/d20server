// @ts-check
import { Events } from '../../common/events.js';
import { UpdateFOW } from '../../common/messages.js';
import { MessageService } from '../service/message-service.js';
import { MapUtils } from '../util/maputil.js';

// @ts-ignore
const ClipperLib = window.ClipperLib;

var _seen = null;
var _cpr = new ClipperLib.Clipper();
var _counter = 0;
export const FOWRenderer = {
    reset: function (fow) {
        _seen = fow;
    },

    updateAndGetClip: function (hiddenArea, viewport) {
        if (hiddenArea == null || hiddenArea == undefined) return null;

        // calculate updated fow area
        const seenArea = FOWRenderer.calculateSeenArea(hiddenArea, viewport);
        if (!_seen || _seen == []) {
            _seen = seenArea;
        } else {
            const result = new ClipperLib.Paths();
            _cpr.Clear();
            _cpr.AddPaths(_seen, ClipperLib.PolyType.ptSubject, true);
            _cpr.AddPaths(seenArea, ClipperLib.PolyType.ptClip, true);
            _cpr.Execute(ClipperLib.ClipType.ctUnion, result);
            _seen = result;
        }

        // update fow on server side
        //TODO: think of a better system than using a counter (and only send of the fow has actually changed)
        _counter++;
        if (_counter == 30 * 10) {
            _counter = 0;
            MessageService.send(new UpdateFOW(MapUtils.currentMap(), _seen, false));
        }

        // substract currently seen area
        const clip = new ClipperLib.Paths();
        _cpr.Clear();
        _cpr.AddPaths(_seen, ClipperLib.PolyType.ptSubject, true);
        _cpr.AddPaths(seenArea, ClipperLib.PolyType.ptClip, true);
        _cpr.Execute(ClipperLib.ClipType.ctDifference, clip);
        return clip;
    },

    calculateSeenArea: function (hiddenArea, viewport) {
        const seenArea = new ClipperLib.Paths();
        _cpr.Clear();
        _cpr.AddPath(viewport.toPath(), ClipperLib.PolyType.ptSubject, true);
        _cpr.AddPaths(hiddenArea, ClipperLib.PolyType.ptClip, true);
        _cpr.Execute(ClipperLib.ClipType.ctDifference, seenArea);
        return seenArea;
    }
}
Events.on('mapChange', event => FOWRenderer.reset(event.data.newFOW));
//Events.on('viewChange', event => FOWRenderer.reset()); //TODO: is this needed?
