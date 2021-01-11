import { MessageService } from '../service/message-service.js';

import { getDefinitions } from '../../common/definitions.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { EntityLoading, ServerDefinitions } from '../../common/messages.js';
import { TokenListUtils } from '../../common/util/token-list-util.js';

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
    // TODO: is waiting here still required, lets try it without

    // send actual data
    for(const manager of EntityManagers.getAll()) {
        manager.fullSync(profile);
    }
}

// add cascading deletes
//TODO: remove and make this datadriven OR make this obsolete by going ahead with the plan to store tokens,... per map (and directly in actor property)
export function setupCascadingDeletes() {
    // remove token list entries on token remove
    EntityManagers.get('token').addRemovalListener((id, token) => {
        for(const [key, list] of Object.entries(EntityManagers.get('token_list').all())) {
            if(TokenListUtils.hasValue(list, id)) {
                TokenListUtils.removeToken(list, id);
            }
        }
    });

    // remove tokens and walls (and drawings => module!) on map remove
    EntityManagers.get('map').addRemovalListener((id, map) => {
        EntityManagers.get('token').removeAll(token => token.prop('map').getLong() == id);
        EntityManagers.get('wall').removeAll(wall => wall.prop('map').getLong() == id);
        EntityManagers.get('drawing').removeAll(drawing => drawing.prop('map').getLong() == id);
    });

    // remove default token on actor remove
    EntityManagers.get('actor').addRemovalListener((id, actor) => {
        if(actor) EntityManagers.get('token').remove(actor.prop('defaultToken').getLong());
    });
}
