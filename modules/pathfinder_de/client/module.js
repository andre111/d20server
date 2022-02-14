import { Events } from '../../../core/common/events.js';

import { CanvasWindowEditActor } from './canvas-window-edit-actor.js';

Events.on('editWindowCreateTabs', event => {
    if (event.data.reference.getType() !== 'actor') return;
    if (event.data.reference.getString('type') !== 'pf_char_de') return;

    new CanvasWindowEditActor(event.data.window, event.data.reference);
    event.cancel();
}, false);

Events.on('createTokenFromActor', event => {
    event.data.token.setString('bar1Current', 'pf_hp');
    event.data.token.setString('bar1Max', 'pf_hpMax');

    event.data.token.setString('bar2Current', 'pf_nonLethalDamage');
    event.data.token.setString('bar2Max', 'pf_hpMax');
});
