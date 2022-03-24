// @ts-check
import { Events } from '../common/events.js';

var _state = null;
export const Client = {
    VERSION: 10,
    FPS: 30,

    getState: function () {
        return _state;
    },

    setState: function (state) {
        if (_state) _state.exit();
        _state = state;
        state.init();

        Events.trigger('enterState', { state: state });
    }
}
