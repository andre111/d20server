import { ServerData } from '../server-data.js';

import { Layer } from '../../common/constants.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';

export const MapUtils =  {
    currentMap: function() {
        const currentMap = ServerData.currentMap;
        return EntityManagers.get('map').find(currentMap);
    },
    
    currentEntities: function(type) {
        const currentMap = ServerData.currentMap;
        return _.chain(EntityManagers.get(type).all()).filter(e => e.prop('map').getLong() == currentMap); 
    },
    
    currentEntitiesInLayer: function(type, l) {
        return MapUtils.currentEntities(type).filter(e => e.prop('layer').getLayer() == l);
    },
    
    currentEntitiesSorted: function(type, l) {
        return MapUtils.currentEntitiesInLayer(type, l).sortBy(e => -e.getID()).sortBy(e => -e.prop('depth').getLong());
    },
    
    findControllableTokens: function(profile) {
        var controllableTokens = [];
        MapUtils.currentEntitiesSorted('token', Layer.MAIN).forEach(token => {
            if(token.getControllingPlayers().includes(profile.getID())) {
                controllableTokens.push(token);
            }
        }).value();
        return controllableTokens;
    }
}
