import { ModeButton, ModeButtonExtended } from '../../../core/client/canvas/mode-panel.js';
import { CanvasWindowInput } from '../../../core/client/canvas/window/canvas-window-input.js';
import { MessageService } from '../../../core/client/service/message-service.js';

import { Events } from '../../../core/common/events.js';
import { EntityManagers } from '../../../core/common/entity/entity-managers.js';
import { SendChatMessage } from '../../../core/common/messages.js';
import { MapUtils } from '../../../core/client/util/maputil.js';

import { ClientBattleManager } from './client-battle-manager.js';
import { CommonBattleManager } from '../common/common-battle-manager.js';

Events.on('addModeButtonsGM', event => {
    event.data.addButton(new ModeButtonExtended(new ModeButton('/modules/battle/files/img/gui/battle', 'Start Battle', () => false, () => {
        const msg = new SendChatMessage('/battle start');
        MessageService.send(msg);
    }), 0));
});

Events.on('entityMenu', event => {
    if(event.data.entityType != 'token') return;
    if(!CommonBattleManager.isBattleActive(MapUtils.currentMap())) return;

    const category = event.data.menu.createCategory(null, 'Battle');

    if(event.data.reference.prop('battle_active').getBoolean()) {
        event.data.menu.createItem(category, 'Set Initiative', () => {
            new CanvasWindowInput('Set Initiative', 'Enter initiative for selected token: ', event.data.reference.prop('battle_initiative').getDouble(), value => {
                if(value == null || value == undefined || value == '') return;
            
                const newValue = Number(value);
                if(newValue != NaN) {
                    event.data.reference.prop('battle_initiative').setDouble(newValue);
                    event.data.reference.performUpdate();
                }
            });
        });
        event.data.menu.createItem(category, 'Leave Battle', () => {
            const msg = new SendChatMessage('/battle leave');
            MessageService.send(msg);
        });
    } else {
        event.data.menu.createItem(category, 'Join Battle', () => {
            const msg = new SendChatMessage('/battle join');
            MessageService.send(msg);
        });
    }
}, true, 300);

// listen for any change that could cause the battle state to change
Events.on('mapChange', event => ClientBattleManager.scanState());
Events.on('createMainHTML', event => {
    EntityManagers.get('map').addListener(() => ClientBattleManager.scanState());
    EntityManagers.get('token').addListener(() => ClientBattleManager.scanState());
});
