import { MessageService } from '../service/message-service.js';

import { getDefinitions } from '../../common/definitions.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { EntityLoading, ServerDefinitions } from '../../common/messages.js';

//NOTE: This sends the client into the loading state -> send EnterGame after calling this!
export function fullSync(profile) {
    // count and send loading info
    var count = 0;
    for(const manager of EntityManagers.getAll()) {
        count += manager.getAccessibleCount(profile);
    }
    MessageService.send(new EntityLoading(count), profile);

    // TODO: weird place, but sync definitions here
    MessageService.send(new ServerDefinitions(getDefinitions()), profile);
    
    // send actual data
    for(const manager of EntityManagers.getAll()) {
        manager.fullSync(profile);
    }
}

// add cascading deletes
//TODO: remove and make this datadriven OR make this obsolete by going ahead with the plan to store tokens,... per map (and directly in actor property)
export function setupCascadingDeletes() {
    // remove tokens and walls (and drawings => module!) on map remove
    EntityManagers.get('map').addRemovalListener((id, map) => {
        EntityManagers.get('token').removeAll(token => token.getLong('map') == id);
        EntityManagers.get('wall').removeAll(wall => wall.getLong('map') == id);
        EntityManagers.get('drawing').removeAll(drawing => drawing.getLong('map') == id);
    });
}
