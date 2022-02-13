export class CommonBattleManager {
    static getParticipatingTokens(map) {
        if(!map) return [];

        // find all participating tokens
        var tokens = [];
        for(const token of map.getContainedEntityManager('token').all()) {
            if(token.getBoolean('battle_active')) {
                tokens.push(token);
            }
        }

        // sort by initiative
        tokens.sort((t1, t2) => {
            const v1 = t1.getDouble('battle_initiative');
            const v2 = t2.getDouble('battle_initiative');
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
        if(!map) return null;
        
        const tokenIDs = CommonBattleManager.getParticipatingTokens(map);

        for(const tokenID of tokenIDs) {
            const token = map.getContainedEntityManager('token').find(tokenID);
            if(token && !token.getBoolean('battle_turnEnded')) {
                return token;
            }
        }

        return null;
    }

    static isBattleActive(map) {
        if(!map) return false;
        return map.getBoolean('battle_active');
    }
    
    static getBattleRound(map) {
        if(!map) return -1;
        return map.getLong('battle_round');
    }
}
