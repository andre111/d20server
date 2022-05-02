// @ts-check
import { Events } from '../../../core/common/events.js';

import { CanvasWindowEditActor } from './canvas-window-edit-actor.js';
import { CanvasWindowEditSpell } from './canvas-window-edit-spell.js';

Events.on('openEntity', event => {
    const entity = event.data.entity;
    if (entity.getType() === 'actor' && entity.getString('type') === 'pf_char_de') {
        new CanvasWindowEditActor(event.data.parentWindow, entity);
        event.cancel();
    } else if (entity.getType() === 'attachment' && entity.getString('type') === 'pf_spell_de') {
        new CanvasWindowEditSpell(event.data.parentWindow, entity);
        event.cancel();
    }
}, false, 1);

Events.on('createTokenFromActor', event => {
    event.data.token.setString('bar1Current', 'pf_hp');
    event.data.token.setString('bar1Max', 'pf_hpMax');

    event.data.token.setString('bar2Current', 'pf_nonLethalDamage');
    event.data.token.setString('bar2Max', 'pf_hpMax');
});
