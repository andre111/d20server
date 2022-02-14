import { ServerData } from '../../../core/client/server-data.js';
import { MapUtils } from '../../../core/client/util/maputil.js';

import { CanvasWindowConfirm } from '../../../core/client/canvas/window/canvas-window-confirm.js';
import { BattleList } from './battle-list.js';
import { CommonBattleManager } from '../common/common-battle-manager.js';
import { MessageService } from '../../../core/client/service/message-service.js';
import { SendChatMessage } from '../../../core/common/messages.js';
import { I18N } from '../../../core/common/util/i18n.js';

export class ClientBattleManager {
    static #container = null;
    static #infoRoundEl = null;
    static #entryList = null;
    static #guiCallback = null;

    static scanState() {
        // rebuild gui (scheduled on frame to group closely related changes into one update)
        if (ClientBattleManager.#guiCallback == null) ClientBattleManager.#guiCallback = () => ClientBattleManager.updateGui();
        requestAnimationFrame(ClientBattleManager.#guiCallback);
    }

    //----------------------------------------------------
    // GUI-METHODS
    //----------------------------------------------------
    static updateGui() {
        // create container
        if (ClientBattleManager.#container == null) {
            const container = document.createElement('div');
            container.className = 'battle-panel';
            document.body.appendChild(container);

            // battle info
            //TODO: extract into its own class?
            const battleInfo = document.createElement('li');
            battleInfo.className = 'battle-info';
            ClientBattleManager.#infoRoundEl = document.createElement('span');
            battleInfo.appendChild(ClientBattleManager.#infoRoundEl);
            if (ServerData.isGM()) {
                // controll buttons
                const nextTurnButton = document.createElement('button');
                nextTurnButton.innerText = I18N.get('battle.nextturn', 'Next Turn');
                nextTurnButton.onclick = () => {
                    const msg = new SendChatMessage('/battle nextTurn');
                    MessageService.send(msg);
                };
                battleInfo.appendChild(nextTurnButton);

                const endBattleButton = document.createElement('button');
                endBattleButton.innerText = I18N.get('battle.end', 'End Battle');
                endBattleButton.onclick = () => new CanvasWindowConfirm(null, I18N.get('window.battle.end.title', 'End Battle'), I18N.get('window.battle.end.prompt', 'Do you want to end the current battle?'), () => {
                    const msg = new SendChatMessage('/battle end');
                    MessageService.send(msg);
                });
                battleInfo.appendChild(endBattleButton);
            }
            container.appendChild(battleInfo);

            // list
            ClientBattleManager.#entryList = new BattleList();
            container.appendChild(ClientBattleManager.#entryList.getElement());

            ClientBattleManager.#container = container;
        }
        const container = ClientBattleManager.#container;

        // toggle visibility
        const map = MapUtils.currentMap();
        const active = CommonBattleManager.isBattleActive(map);
        container.style.visibility = active ? 'visible' : 'hidden';

        //
        if (active) {
            ClientBattleManager.#infoRoundEl.innerHTML = I18N.get('battle.info', 'Battle<br>Round %0', map.getLong('battle_round'));
            ClientBattleManager.#entryList.reload(CommonBattleManager.getParticipatingTokens(map));
        }
    }
}
