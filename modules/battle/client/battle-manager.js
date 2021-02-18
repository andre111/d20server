import { ServerData } from '../../../core/client/server-data.js';
import { MapUtils } from '../../../core/client/util/maputil.js';
import { EntityReference } from '../../../core/client/entity/entity-reference.js';

import { Events } from '../../../core/common/events.js';
import { EntityManagers } from '../../../core/common/entity/entity-managers.js';
import { BattleEntry } from './battle-entry.js';
import { CanvasWindowConfirm } from '../../../core/client/canvas/window/canvas-window-confirm.js';
import { BattleList } from './battle-list.js';

export class BattleManager {
    static #tokensIDs = [];
    static #container = null;
    static #infoRoundEl = null;
    static #entryList = null;
    static #guiCallback = null;

    static scanState() {
        // find all participating tokens
        var tokens = [];
        for(const token of MapUtils.currentEntities('token')) {
            if(token.prop('battle_active').getBoolean()) {
                tokens.push(token);
            }
        }

        // sort by initiative
        tokens.sort((t1, t2) => {
            const v1 = t1.prop('battle_initiative').getDouble();
            const v2 = t2.prop('battle_initiative').getDouble();
            return v2 - v1;
        });
        
        // store ids only
        BattleManager.#tokensIDs = [];
        for(const token of tokens) {
            BattleManager.#tokensIDs.push(token.getID());
        }

        // rebuild gui (scheduled on frame to group closely related changes into one update)
        if(BattleManager.#guiCallback == null) BattleManager.#guiCallback = () => BattleManager.updateGui();
        requestAnimationFrame(BattleManager.#guiCallback);
        //TODO: if GM -> check if currentToken has turn started and if not start it? (might cause race conditions with multiple gms when done here)
    }

    static isBattleActive() {
        const map = MapUtils.currentMap();
        if(map) {
            return map.prop('battle_active').getBoolean();
        }
        return false;
    }

    //----------------------------------------------------
    // GUI-METHODS
    //----------------------------------------------------
    static updateGui() {
        // create container
        if(BattleManager.#container == null) {
            const container = document.createElement('div');
            container.className = 'battle-panel';
            document.body.appendChild(container);

            // battle info
            //TODO: extract into its own class?
            const battleInfo = document.createElement('li');
            battleInfo.className = 'battle-info';
            BattleManager.#infoRoundEl = document.createElement('span');
            battleInfo.appendChild(BattleManager.#infoRoundEl);
            if(ServerData.isGM()) {
                // controll buttons
                const nextTurnButton = document.createElement('button');
                nextTurnButton.innerText = 'Next Turn';
                nextTurnButton.onclick = () => BattleManager.nextTurn();
                battleInfo.appendChild(nextTurnButton);

                const endBattleButton = document.createElement('button');
                endBattleButton.innerText = 'End Battle';
                endBattleButton.onclick = () => new CanvasWindowConfirm('End Battle', 'Do you want to end the current battle?', () => BattleManager.endBattle());
                battleInfo.appendChild(endBattleButton);
            }
            container.appendChild(battleInfo);

            // list
            BattleManager.#entryList = new BattleList();
            container.appendChild(BattleManager.#entryList.getElement());

            BattleManager.#container = container;
        }
        const container = BattleManager.#container;

        // toggle visibility
        container.style.visibility = BattleManager.isBattleActive() ? 'visible' : 'hidden';

        const map = MapUtils.currentMap();
        if(!map) return;

        //
        BattleManager.#infoRoundEl.innerHTML = 'Battle<br>Round '+map.prop('battle_round').getLong();
        BattleManager.#entryList.reload(BattleManager.#tokensIDs);
    }

    //----------------------------------------------------
    // GM-METHODS
    //----------------------------------------------------
    static startBattle() {
        // check limitations
        if(!ServerData.isGM()) return;
        if(BattleManager.isBattleActive()) return;

        const map = MapUtils.currentMap();
        if(!map) return;

        // activate battle
        const mapRef = new EntityReference(map);
        mapRef.prop('battle_active').setBoolean(true);
        mapRef.prop('battle_round').setLong(1);
        mapRef.performUpdate();
        BattleManager.resetTokens();
    }

    static endBattle() {
        // check limitations
        if(!ServerData.isGM()) return;
        if(!BattleManager.isBattleActive()) return;

        const map = MapUtils.currentMap();
        if(!map) return;

        // end battle
        const mapRef = new EntityReference(map);
        mapRef.prop('battle_active').setBoolean(false);
        mapRef.prop('battle_round').setLong(0);
        mapRef.performUpdate();
        BattleManager.resetTokens();
    }

    static nextTurn() {
        // check limitations
        if(!ServerData.isGM()) return;
        if(!BattleManager.isBattleActive()) return;
        
        const map = MapUtils.currentMap();
        if(!map) return;

        // TODO: perform actions
        // end turn of current token (and check if a next one exists)
        var current = null;
        var foundNext = false;
        for(const tokenID of BattleManager.#tokensIDs) {
            const token = EntityManagers.get('token').find(tokenID);
            if(token && !token.prop('battle_turnEnded').getBoolean()) {
                if(current == null) {
                    current = token;
                } else {
                    foundNext = true;
                }
            }
        }

        if(foundNext) {
            // if a next token was found just mark the current one as turn ended
            const tokenRef = new EntityReference(current);
            tokenRef.prop('battle_turnEnded').setBoolean(true);
            tokenRef.performUpdate();
        } else  {
            // if no next one exists -> start a new round
            const mapRef = new EntityReference(map);
            mapRef.prop('battle_round').setLong(mapRef.prop('battle_round').getLong()+1);
            mapRef.performUpdate();
            for(const tokenID of BattleManager.#tokensIDs) {
                const token = EntityManagers.get('token').find(tokenID);
                if(token) {
                    const tokenRef = new EntityReference(token);
                    tokenRef.prop('battle_turnStarted').setBoolean(false);
                    tokenRef.prop('battle_turnEnded').setBoolean(false);
                    tokenRef.performUpdate();
                }
            }
        }
    }
    
    static resetTokens() {
        // check limitations
        if(!ServerData.isGM()) return;
        if(!BattleManager.isBattleActive()) return;

        // reset tokens to not be part of the battle
        for(const token of MapUtils.currentEntities('token')) {
            const tokenRef = new EntityReference(token);
            tokenRef.prop('battle_active').setBoolean(false);
            tokenRef.prop('battle_turnStarted').setBoolean(false);
            tokenRef.prop('battle_turnEnded').setBoolean(false);
            tokenRef.performUpdate();
        }
    }
}

// listen for any change that could cause the battle state to change
Events.on('mapChange', () => BattleManager.scanState());
Events.on('createMainHTML', () => {
    EntityManagers.get('map').addListener(() => BattleManager.scanState());
    EntityManagers.get('token').addListener(() => BattleManager.scanState());
});
