import { ServerData } from '../server-data.js';

import { Layer } from '../../common/constants.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';

export const MapUtils =  {
    currentMap: function() {
        const currentMap = ServerData.currentMap;
        return EntityManagers.get('map').find(currentMap);
    },
    
    currentEntities: function(type) {
        const currentMap = MapUtils.currentMap();
        if(currentMap) {
            const manager = currentMap.getContainedEntityManager(type);
            return manager ? manager.all() : []; 
        } else {
            return [];
        }
    },
    
    currentEntitiesInLayer: function(type, l) {
        return MapUtils.currentEntities(type).filter(e => e.getLayer('layer') == l);
    },
    
    currentEntitiesSorted: function(type, l) {
        return MapUtils.currentEntitiesInLayer(type, l).sort((a, b) => b.getID() - a.getID()).sort((a, b) => b.getLong('depth') - a.getLong('depth'));
    },
    
    findControllableTokens: function(profile) {
        var controllableTokens = [];
        MapUtils.currentEntitiesSorted('token', Layer.MAIN).forEach(token => {
            if(token.getControllingPlayers().includes(profile.getID())) {
                controllableTokens.push(token);
            }
        });
        return controllableTokens;
    }
}
