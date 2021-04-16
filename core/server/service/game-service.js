import { fullSync } from '../entity/server-entity-managers.js';
import { EDIT_KEY } from '../handler/filemanager.js';
import { ChatService } from './chat-service.js';
import { MessageService } from './message-service.js';
import { UserService } from './user-service.js';

import { Entity } from '../../common/common.js';
import { Role } from '../../common/constants.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { AddEntity, EnterGame, EnterMap, PlayerList } from '../../common/messages.js';
import { ModuleService } from './module-service.js';

export class GameService {
    static init() {
		// add atleast one map
        if(EntityManagers.get('map').all().length == 0) {
            const map = new Entity('map');
            map.prop('name').setString('New Map');
            EntityManagers.get('map').add(map);
        }
    }

    static joinGame(profile) {
        GameService.updateClientState(profile);
        ChatService.appendNote(null, `${profile.getUsername()} joined!`);
    }

    static leaveGame(profile) {
        MessageService.broadcast(new PlayerList(UserService.getAllProfiles()));
        ChatService.appendNote(null, `${profile.getUsername()} left!`);
    }

    static updateClientState(profile) {
        // sync data -> moves client into loading state
        fullSync(profile);

        // send enter message -> moves client into main state ans sets client role/profile and edit key for gms
        MessageService.send(new EnterGame(profile, profile.getRole() == Role.GM ? EDIT_KEY : -1), profile);

        // update player list (to all)
        MessageService.broadcast(new PlayerList(UserService.getAllProfiles()));

        // send game state
        GameService.reloadMaps(profile);
        ChatService.sendHistory(profile, 100);
        ModuleService.sendModuleDefinitions(profile);
    }

    static reloadMaps(profile) {
        // profile can be null => reload for all
        if(profile) {
            const map = EntityManagers.get('map').find(profile.getCurrentMap());
            if(map) {
                MessageService.send(new AddEntity(map), profile); // send map because client could have no independent access
                MessageService.send(new EnterMap(map), profile);
            }
        } else {
            UserService.forEach(profile => GameService.reloadMaps(profile));
        }
    }
}
