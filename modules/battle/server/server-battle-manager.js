import { EntityManagers } from '../../../core/common/entity/entity-managers.js';
import { EntityReference } from '../../../core/common/entity/entity-reference.js';
import { CommonBattleManager } from '../common/common-battle-manager.js';

export class ServerBattleManager {
    static startBattle(map) {
        if(!map) return;
        if(CommonBattleManager.isBattleActive(map)) return;

        // activate battle
        const mapRef = new EntityReference(map);
        mapRef.prop('battle_active').setBoolean(true);
        mapRef.prop('battle_round').setLong(1);
        mapRef.performUpdate();
        ServerBattleManager.resetTokens(map);
    }

    static endBattle(map) {
        if(!map) return;
        if(!CommonBattleManager.isBattleActive(map)) return;

        // end battle
        ServerBattleManager.resetTokens(map);
        const mapRef = new EntityReference(map);
        mapRef.prop('battle_active').setBoolean(false);
        mapRef.prop('battle_round').setLong(0);
        mapRef.performUpdate();
    }

    static nextTurn(map) {
        if(!map) return;
        if(!CommonBattleManager.isBattleActive(map)) return;

        //TODO...
        const tokenIDs = CommonBattleManager.getParticipatingTokens(map);

        // end turn of current token (and check if a next one exists)
        var current = null;
        var next = null;
        var references = [];
        for(const tokenID of tokenIDs) {
            const token = EntityManagers.get('token').find(tokenID);
            if(token) {
                const ref = new EntityReference(token);
                references.push(ref);

                if(!ref.prop('battle_turnEnded').getBoolean()) {
                    if(current == null) {
                        current = ref;
                    } else if(next == null) {
                        next = ref;
                    }
                }
            }
        }

        // end the turn of current token
        if(current) {
            current.prop('battle_turnEnded').setBoolean(true);
            ServerBattleManager.onTurnEnd(map, current);
        }

        if(!next) {
            // if no next one exists -> start a new round
            const mapRef = new EntityReference(map);
            mapRef.prop('battle_round').setLong(mapRef.prop('battle_round').getLong()+1);
            mapRef.performUpdate();

            for(const ref of references) {
                ref.prop('battle_turnStarted').setBoolean(false);
                ref.prop('battle_turnEnded').setBoolean(false);
            }
        }

        // perform combined updates
        for(const ref of references) {
            ref.performUpdate();
        }
    }

    static resetTokens(map) {
        if(!map) return;

        for(const token of EntityManagers.get('token').all()) {
            if(token.prop('map').getLong() == map.getID()) {
                const tokenRef = new EntityReference(token);
                tokenRef.prop('battle_active').setBoolean(false);
                tokenRef.prop('battle_turnStarted').setBoolean(false);
                tokenRef.prop('battle_turnEnded').setBoolean(false);
                tokenRef.performUpdate();
            }
        }
    }

    static onTurnStart(map, tokenRef) {
        //TODO: here is the place to subtract effects durations

    }

    static onTurnEnd(map, tokenRef) {

    }

    static updateState(map) {
        if(!map) return;

        // find current active token
        const activeToken = CommonBattleManager.getActiveToken(map);
        if(activeToken) {
            // check if its turn was started -> start it if not
            if(!activeToken.prop('battle_turnStarted').getBoolean()) {
                const tokenRef = new EntityReference(activeToken);
                tokenRef.prop('battle_turnStarted').setBoolean(true);
                tokenRef.performUpdate();

                ServerBattleManager.onTurnStart(map, tokenRef);
            }
        }
    }
}
