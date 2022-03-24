// @ts-check
import { fullSync } from '../entity/server-entity-managers.js';
import { EDIT_KEY } from '../handler/filemanager.js';
import { ChatService } from './chat-service.js';
import { MessageService } from './message-service.js';
import { UserService } from './user-service.js';

import { Entity } from '../../common/common.js';
import { Access, Role } from '../../common/constants.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { ChangeConfig, EnterGame, EnterMap, PlayerList } from '../../common/messages.js';
import { ModuleService } from './module-service.js';
import { fromJson, toJson } from '../../common/util/datautil.js';
import { CONFIG } from '../../common/config.js';
import { I18N } from '../../common/util/i18n.js';

export class GameService {
    static init() {
        // add atleast one map
        if (EntityManagers.get('map').all().length == 0) {
            const map = new Entity('map');
            map.setString('name', 'New Map');
            EntityManagers.get('map').add(map);
        }
    }

    static joinGame(profile) {
        GameService.updateClientState(profile);
        ChatService.appendNote(null, I18N.get('game.join', '%0 joined!', profile.getUsername()));
    }

    static leaveGame(profile) {
        MessageService.broadcast(new PlayerList(UserService.getAllProfiles()));
        ChatService.appendNote(null, I18N.get('game.leave', '%0 left!', profile.getUsername()));
    }

    static updateClientState(profile) {
        // sync config
        CONFIG.iterate((key, def, value) => {
            if (def.clientAccessible) {
                MessageService.send(new ChangeConfig(key, value), profile);
            }
        });

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
        if (profile) {
            const map = EntityManagers.get('map').find(profile.getCurrentMap());
            if (map) {
                EntityManagers.get('map').syncEntity(profile, map); // send map and contained entities because client could have no previous access
                MessageService.send(new EnterMap(map, GameService.getFOW(map, profile)), profile);
            }
        } else {
            UserService.forEach(profile => GameService.reloadMaps(profile));
        }
    }

    static getFOW(map, profile) {
        if (!map || !profile) return [];
        const manager = map.getContainedEntityManager('fow');
        if (!manager) return [];
        const fowEntity = manager.find(profile.getID());
        if (!fowEntity) return [];

        return fromJson(fowEntity.getString('area'));
    }

    static setFOW(map, profile, fow) {
        if (!map || !profile || !fow) throw new Error('Missing required parameter');
        const manager = map.getContainedEntityManager('fow');
        if (!manager.has(profile.getID())) {
            manager.add(new Entity('fow', profile.getID()));
        }

        manager.updateProperties(profile.getID(), { 'area': toJson(fow) }, Access.SYSTEM);
    }

    static resetFOW(map) {
        if (!map) throw new Error('Missing required parameter');
        const manager = map.getContainedEntityManager('fow');
        for (const fowEntity of manager.all()) {
            manager.remove(fowEntity.getID());
        }

        GameService.reloadMaps();
    }
}
