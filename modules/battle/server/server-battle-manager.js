import { token } from 'morgan';
import { EntityManagers } from '../../../core/common/entity/entity-managers.js';
import { EntityReference } from '../../../core/common/entity/entity-reference.js';
import { SendNotification } from '../../../core/common/messages.js';
import { TokenUtil } from '../../../core/common/util/tokenutil.js';
import { MessageService } from '../../../core/server/service/message-service.js';
import { UserService } from '../../../core/server/service/user-service.js';
import { CommonBattleManager } from '../common/common-battle-manager.js';

export class ServerBattleManager {
    static startBattle(map) {
        if(!map) return;
        if(CommonBattleManager.isBattleActive(map)) return;

        // activate battle
        ServerBattleManager.resetTokens(map);
        const mapRef = new EntityReference(map);
        mapRef.setBoolean('battle_active', true);
        mapRef.setLong('battle_round', 0);
        mapRef.performUpdate();

        // send notification
        const msg = new SendNotification(`Battle started!`, 5);
        MessageService.broadcast(msg, map);
    }

    static endBattle(map) {
        if(!map) return;
        if(!CommonBattleManager.isBattleActive(map)) return;

        // end battle
        const mapRef = new EntityReference(map);
        mapRef.setBoolean('battle_active', false);
        mapRef.setLong('battle_round', 0);
        mapRef.performUpdate();
        ServerBattleManager.resetTokens(map);

        // send notification
        const msg = new SendNotification(`Battle ended!`, 5);
        MessageService.broadcast(msg, map);
    }

    static nextTurn(map) {
        if(!map) return;
        if(!CommonBattleManager.isBattleActive(map)) return;

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

                if(!ref.getBoolean('battle_turnEnded')) {
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
            current.setBoolean('battle_turnEnded', true);
            ServerBattleManager.onTurnEnd(map, current);
        }

        if(!next) {
            // if no next one exists -> start a new round
            const mapRef = new EntityReference(map);
            const round = mapRef.getLong('battle_round')+1;
            mapRef.setLong('battle_round', round);
            mapRef.performUpdate();

            // send notification
            const msg = new SendNotification(`Round ${round}`, 5);
            MessageService.broadcast(msg, map);

            // reset token state
            for(const ref of references) {
                ref.setBoolean('battle_turnStarted', false);
                ref.setBoolean('battle_turnEnded', false);
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
            if(token.getLong('map') == map.getID()) {
                const tokenRef = new EntityReference(token);
                tokenRef.setBoolean('battle_active', false);
                tokenRef.setBoolean('battle_turnStarted', false);
                tokenRef.setBoolean('battle_turnEnded', false);
                tokenRef.performUpdate();
            }
        }
    }

    static onTurnStart(map, tokenRef) {
        // send out notification of turn (important: to everybody on the map BUT respect name visibility)
        UserService.forEach(profile => {
            if(profile.getCurrentMap() == map.getID()) {
                const actor = TokenUtil.getActor(tokenRef);
                
                var content = `???s Turn`
                if(actor) {
                    const accessLevel = actor.getAccessLevel(profile);
                    if(actor.canViewWithAccess(accessLevel) && actor.canViewProperty('name', accessLevel) && actor.getString('name')) {
                        content = `${actor.getString('name')}s Turn`;
                    }
                }
                const msg = new SendNotification(content, 5);
                MessageService.send(msg, profile);
            }
        });

        //TODO: here is the place to subtract effects durations (also send notification when an effect runs out, to controlling players and GMs)

    }

    static onTurnEnd(map, tokenRef) {

    }

    static updateState(map) {
        if(!map) return;

        // find current active token
        const activeToken = CommonBattleManager.getActiveToken(map);
        if(activeToken) {
            // check if its turn was started -> start it if not
            if(!activeToken.getBoolean('battle_turnStarted')) {
                const tokenRef = new EntityReference(activeToken);
                tokenRef.setBoolean('battle_turnStarted', true);
                tokenRef.performUpdate();

                ServerBattleManager.onTurnStart(map, tokenRef);
            }
        }
    }
}
