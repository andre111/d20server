import { Events } from '../../../core/common/events.js';

import { CanvasWindowEditActor } from './canvas-window-edit-actor.js';

Events.on('openEntity', event => {
    if (event.data.entity.getType() === 'actor' && event.data.entity.getString('type') === 'pf_char_de') {
        new CanvasWindowEditActor(event.data.parentWindow, event.data.entity);
        event.cancel();
    }
}, false, 1);

Events.on('createTokenFromActor', event => {
    event.data.token.setString('bar1Current', 'pf_hp');
    event.data.token.setString('bar1Max', 'pf_hpMax');

    event.data.token.setString('bar2Current', 'pf_nonLethalDamage');
    event.data.token.setString('bar2Max', 'pf_hpMax');
});
