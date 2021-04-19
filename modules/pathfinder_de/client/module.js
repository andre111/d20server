import { Events } from '../../../core/common/events.js';

import { CanvasWindowEditActor } from './canvas-window-edit-actor.js';

Events.on('editWindowCreateTabs', event => {
    if(event.data.reference.getType() !== 'actor') return;
    if(event.data.reference.prop('type').getString() !== 'pf_char_de') return;
    
    new CanvasWindowEditActor(event.data.window, event.data.reference);
    event.cancel();
}, false);
