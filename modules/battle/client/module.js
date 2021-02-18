import { ModeButton, ModeButtonExtended } from '../../../core/client/canvas/mode-panel.js';
import { CanvasWindowInput } from '../../../core/client/canvas/window/canvas-window-input.js';

import { Events } from '../../../core/common/events.js';
import { BattleManager } from './battle-manager.js';

Events.on('addModeButtonsGM', event => {
    event.addButton(new ModeButtonExtended(new ModeButton('/modules/battle/files/img/gui/battle', 'Start Battle', () => false, () => BattleManager.startBattle()), 0));
});

Events.on('entityMenu', event => {
    if(event.entityType != 'token') return;
    if(!BattleManager.isBattleActive()) return;

    const category = event.menu.createCategory(null, 'Battle');

    if(event.reference.prop('battle_active').getBoolean()) {
        event.menu.createItem(category, 'Set Initiative', () => {
            new CanvasWindowInput('Set Initiative', 'Enter initiative for selected token: ', event.reference.prop('battle_initiative').getDouble(), value => {
                if(value == null || value == undefined || value == '') return;
            
                const newValue = Number(value);
                if(newValue != NaN) {
                    event.reference.prop('battle_initiative').setDouble(newValue);
                    event.reference.performUpdate();
                }
            });
        });
        event.menu.createItem(category, 'Leave Battle', () => {
            event.reference.prop('battle_active').setBoolean(false);
            event.reference.performUpdate();
        });
    } else {
        event.menu.createItem(category, 'Join Battle', () => {
            event.reference.prop('battle_active').setBoolean(true);
            event.reference.performUpdate();
        });
    }
});
