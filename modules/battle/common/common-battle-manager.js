import { EntityManagers } from '../../../core/common/entity/entity-managers.js';

export class CommonBattleManager {
    static getParticipatingTokens(map) {
        if(!map) return [];

        // find all participating tokens
        var tokens = [];
        for(const token of EntityManagers.get('token').all()) {
            if(token.prop('map').getLong() == map.getID()) {
                if(token.prop('battle_active').getBoolean()) {
                    tokens.push(token);
                }
            }
        }

        // sort by initiative
        tokens.sort((t1, t2) => {
            const v1 = t1.prop('battle_initiative').getDouble();
            const v2 = t2.prop('battle_initiative').getDouble();
            return v2 - v1;
        });
        
        // store ids only
        var tokenIDs = [];
        for(const token of tokens) {
            tokenIDs.push(token.getID());
        }

        return tokenIDs;
    }

    static getActiveToken(map) {
        const tokenIDs = CommonBattleManager.getParticipatingTokens(map);

        for(const tokenID of tokenIDs) {
            const token = EntityManagers.get('token').find(tokenID);
            if(token && !token.prop('battle_turnEnded').getBoolean()) {
                return token;
            }
        }

        return null;
    }

    static isBattleActive(map) {
        if(!map) return false;
        return map.prop('battle_active').getBoolean();
    }
    
    static getBattleRound(map) {
        if(!map) return -1;
        return map.prop('battle_round').getLong();
    }
}
