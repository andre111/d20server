import { EntityManagers } from '../../../core/common/entity/entity-managers.js';
import { Events } from '../../../core/common/events.js';
import { PlayEffect } from '../../../core/common/messages.js';
import { MessageService } from '../../../core/server/service/message-service.js';
import { UserService } from '../../../core/server/service/user-service.js';

// implements portal functionality
Events.on('modify_token', event => {
    // get old and "new" position
    const oldX = event.data.entity.getLong('x');
    const oldY = event.data.entity.getLong('y');
    var newX = oldX;
    var newY = oldY;
    if(event.data.propertiesToChange.hasOwnProperty('x')) newX = event.data.propertiesToChange['x'];
    if(event.data.propertiesToChange.hasOwnProperty('y')) newY = event.data.propertiesToChange['y'];

    // only act on changes
    if(oldX != newX || oldY != newY) {
        const map = EntityManagers.get(event.data.entity.getManager()).parentEntity;
        if(!map) {
            console.log('Could not get map for modified token?');
            return;
        }

        // find portal at current location
        var portal = null;
        map.getContainedEntityManager('portal').all().forEach(p => {
            if(p.getLong('x1') == newX && p.getLong('y1') == newY) {
                portal = p;
            }
        });

        if(portal) {
            // change movement target to portal 
            event.data.propertiesToChange['x'] = portal.getLong('x2');
            event.data.propertiesToChange['y'] = portal.getLong('y2');

            // move camera of players currently selecting this token
            const msg = new PlayEffect('NONE', portal.getLong('x2'), portal.getLong('y2'), 0, 1, false, true, '');
            UserService.forEach(player => {
                if(player.getSelectedTokens().includes(event.data.entity)) {
                    MessageService.send(msg, player);
                }
            });
        }
    }
}, false, 100);
