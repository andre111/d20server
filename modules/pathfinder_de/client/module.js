import { Events } from '../../../core/common/events.js';

import { CanvasWindowEditActor } from './canvas-window-edit-actor.js';

Events.on('editWindowCreateTabs', event => {
    if(event.data.reference.getType() !== 'actor') return;
    if(event.data.reference.prop('type').getString() !== 'pf_char_de') return;
    
    new CanvasWindowEditActor(event.data.window, event.data.reference);
    event.cancel();
}, false);

Events.on('createTokenFromActor', event => {
    event.data.token.prop('bar1Current').setString('pf_hp');
    event.data.token.prop('bar1Max').setString('pf_hpMax');

    event.data.token.prop('bar2Current').setString('pf_nonLethalDamage');
    event.data.token.prop('bar2Max').setString('pf_hpMax');
});
