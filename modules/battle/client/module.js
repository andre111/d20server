// @ts-check
import { ModeButton, ModeButtonExtended } from '../../../core/client/canvas/mode-panel.js';
import { CanvasWindowInput } from '../../../core/client/canvas/window/canvas-window-input.js';
import { MessageService } from '../../../core/client/service/message-service.js';

import { Events } from '../../../core/common/events.js';
import { SendChatMessage } from '../../../core/common/messages.js';
import { MapUtils } from '../../../core/client/util/maputil.js';

import { ClientBattleManager } from './client-battle-manager.js';
import { CommonBattleManager } from '../common/common-battle-manager.js';
import { I18N } from '../../../core/common/util/i18n.js';

Events.on('addModeButtonsGM', event => {
    event.data.addButton(new ModeButtonExtended(new ModeButton('/modules/battle/files/img/gui/battle', I18N.get('mode.battle', 'Start Battle'), () => false, () => {
        const msg = new SendChatMessage('/battle start');
        MessageService.send(msg);
    }), 0));
});

Events.on('entityMenu', event => {
    if (event.data.entityType != 'token') return;
    if (!CommonBattleManager.isBattleActive(MapUtils.currentMap())) return;

    const category = event.data.menu.createCategory(null, I18N.get('token.menu.battle', 'Battle'));

    if (event.data.reference.getBoolean('battle_active')) {
        event.data.menu.createItem(category, I18N.get('token.menu.battle.initiative', 'Set Initiative'), () => {
            new CanvasWindowInput(null, I18N.get('window.battle.initiative.title', 'Set Initiative'), I18N.get('window.battle.initiative.prompt', 'Enter initiative for selected token: '), event.data.reference.getDouble('battle_initiative'), value => {
                if (value == null || value == undefined || value == '') return;

                const newValue = Number(value);
                if (newValue != NaN) {
                    event.data.reference.setDouble('battle_initiative', newValue);
                    event.data.reference.performUpdate();
                }
            });
        });
        event.data.menu.createItem(category, I18N.get('token.menu.battle.leave', 'Leave Battle'), () => {
            const msg = new SendChatMessage('/battle leave');
            MessageService.send(msg);
        });
    } else {
        event.data.menu.createItem(category, I18N.get('token.menu.battle.join', 'Join Battle'), () => {
            const msg = new SendChatMessage('/battle join');
            MessageService.send(msg);
        });
    }
}, true, 300);

// listen for any change that could cause the battle state to change
Events.on('enterMainState', event => {
    ClientBattleManager.scanState();
    Events.on('mapChange', event => ClientBattleManager.scanState());
    Events.on('any_map', event => ClientBattleManager.scanState());
    Events.on('any_token', event => ClientBattleManager.scanState());
    Events.on('any_actor', event => ClientBattleManager.scanState());
});
