// @ts-check
import { ChatService } from '../service/chat-service.js';
import { MessageService } from '../service/message-service.js';
import { UserService } from '../service/user-service.js';

import { EntityManagers } from '../../common/entity/entity-managers.js';
import { ActionCommand, AddEntities, ChangeConfig, CopyEntity, EntityLoading, MakeActorLocal, MovePlayerToMap, Ping, PlayEffect, PlayerList, RemoveEntity, RequestAccounts, ResponseFail, ResponseOk, SelectedEntities, SendChatMessage, SendNotification, SetPlayerColor, SignIn, SignOut, ToggleModule, UpdateEntityProperties, UpdateFOW } from '../../common/messages.js';
import { Role } from '../../common/constants.js';
import { GameService } from '../service/game-service.js';
import { VERSION } from '../version.js';
import { Events } from '../../common/events.js';
import { ModuleService } from '../service/module-service.js';
import { EntityReference } from '../../common/entity/entity-reference.js';
import { CONFIG } from '../../common/config.js';
import { I18N } from '../../common/util/i18n.js';
import { saveJsonFile } from '../util/fileutil.js';
import { PARAMETERS } from '../parameters.js';

function _handleRequestAccounts(ws, message) {
    MessageService._send(new PlayerList(UserService.getAllProfiles()), ws);
}

function _handleSignIn(ws, message) {
    // check version
    if (message.getAppVersion() != VERSION) {
        MessageService._send(new ResponseFail('SignIn', I18N.get('signin.error.version', 'Version not matching server.')), ws);
        return;
    }

    // remove outer whitespace
    const username = message.getUsername().trim();
    const accessKey = message.getPassword().trim();

    // find profile and verify access key
    var profile = UserService.findByUsername(username);
    if (profile && !UserService.checkAccessKey(profile, accessKey)) profile = null;
    if (!profile) {
        MessageService._send(new ResponseFail('SignIn', I18N.get('signin.error.credentials', 'Incorrect Username or Access Key.')), ws);
        return;
    }

    // check gm lockout
    if (CONFIG.get('gmLockout') && profile.getRole() != Role.GM) {
        MessageService._send(new ResponseFail('SignIn', I18N.get('signin.error.lockout', 'Server is locked down for GM Access only.')), ws);
        return;
    }

    // perform sign in
    MessageService._send(new ResponseOk('SignIn'), ws);
    UserService._onSignIn(profile, ws);
}

function _handleSignOut(profile, message) {
    UserService._onSignOut(profile);
}

function _handleMovePlayerToMap(profile, message) {
    const mapID = message.getMapID();
    const profileID = message.getPlayerID();
    if (EntityManagers.get('map').has(mapID)) {
        if (profileID == 0) {
            if (profile.getRole() != Role.GM) return;

            // set player map id and reset overridden values for all non gms
            UserService.forEach(otherProfile => {
                if (otherProfile.getRole() != Role.GM) {
                    otherProfile.setCurrentMap(mapID);
                    UserService.addAndSave(otherProfile);
                }
            });

            // (re)load maps for clients
            GameService.reloadMaps();
        } else {
            if (profile.getRole() == Role.GM || (profileID == profile.getID() && EntityManagers.get('map').find(mapID).getBoolean('playersCanEnter'))) {
                // set player override map id and (re)load map
                const otherProfile = UserService.getProfile(profileID);
                if (otherProfile) {
                    otherProfile.setCurrentMap(mapID);
                    UserService.addAndSave(otherProfile);

                    // (re)load maps for client
                    GameService.reloadMaps(otherProfile);
                }
            }
        }
    }
}

function _handleSelectedEntities(profile, message) {
    if (message.getType() != 'token') return; //TODO: handle other types

    var selectedTokens = message.getEntities();
    if (!selectedTokens) selectedTokens = [];

    profile.setSelectedTokens(selectedTokens);
}

function _handleActionCommand(profile, message) {
    // create new command instance with set sender and gm state and broadcast
    const sender = profile.getID();
    const gm = profile.getRole() == Role.GM;
    const command = new ActionCommand(message.getCommand(), message.getID(), message.getX(), message.getY(), message.isModified(), message.getText(), sender, gm);
    MessageService.broadcast(command);
}

function _handlePlayEffect(profile, map, message) {
    // send to all players in map (and only allow camera focus for gms)
    const gm = profile.getRole() == Role.GM;
    const effect = new PlayEffect(message.getEffect(), message.getX(), message.getY(), message.getRotation(), message.getScale(), message.isAboveOcclusion(), gm && message.isFocusCamera(), message.getParameters());
    MessageService.broadcast(effect, map);
}

function _handleSetPlayerColor(profile, message) {
    profile.setColor(message.getColor());
    UserService.addAndSave(profile);

    // broadcast player update
    MessageService.broadcast(new PlayerList(UserService.getAllProfiles()));
}

function _handleAddEntities(profile, message) {
    // search for manager, check access and reset id before adding if valid request
    const manager = EntityManagers.get(message.getManager());
    if (manager) {
        for (const entity of message.getEntities()) {
            if (manager.canAddRemove(profile, entity)) {
                entity.resetID();
                manager.add(entity);
            }
        }
    }
}

function _handleRemoveEntity(profile, message) {
    // search for entity, check access and delete if valid request
    const manager = EntityManagers.get(message.getManager());
    if (manager) {
        const entity = manager.find(message.getID());
        if (entity && entity.canEdit(profile) && manager.canAddRemove(profile, entity)) {
            manager.remove(entity.getID());
        }
    }
}

function _handleUpdateEntityProperties(profile, message) {
    // search for entity, check access and update if valid request
    const manager = EntityManagers.get(message.getManager());
    if (manager) {
        const entity = manager.find(message.getID());
        if (entity && entity.canEdit(profile)) {
            manager.updateProperties(entity.getID(), message.getProperties(), entity.getAccessLevel(profile));
        }
    }
}

function _handleCopyEntity(profile, message) {
    // search for entity, check access and copy if valid request
    const manager = EntityManagers.get(message.getManager());
    const targetManager = EntityManagers.get(message.getTargetManager());
    if (manager && targetManager) {
        const entity = manager.find(message.getID());
        if (entity && entity.canEdit(profile) && targetManager.canAddRemove(profile, entity)) {
            // copy entity
            const copiedEntity = entity.clone();
            copiedEntity.resetID();
            targetManager.add(copiedEntity);

            // apply modified properties
            targetManager.updateProperties(copiedEntity.getID(), message.getModifiedProperties(), copiedEntity.getAccessLevel(profile));

            // copy contained entities
            for (const containedEntityType of entity.getDefinition().settings.containedEntities) {
                const containedSourceManager = entity.getContainedEntityManager(containedEntityType);
                const containedTargetManager = copiedEntity.getContainedEntityManager(containedEntityType);
                for (const containedEntity of containedSourceManager.all()) {
                    containedTargetManager.add(containedEntity.clone());
                }
            }
        }
    }
}

function _handleMakeActorLocal(profile, message) {
    // only allow gms
    if (profile.getRole() != Role.GM) return;

    // find token
    const manager = EntityManagers.get(message.getManager());
    if (manager) {
        const token = manager.find(message.getTokenID());
        if (token.getType() != 'token') return;

        // find actor
        if (token.getBoolean('actorLocal')) return;
        const actor = EntityManagers.get('actor').find(token.getLong('actorID'));
        if (!actor) return;

        // store actor locally
        const localManager = token.getContainedEntityManager('actor');
        const clonedActor = actor.clone();
        clonedActor.id = 1;
        localManager.add(clonedActor);

        // update flag
        const reference = new EntityReference(token);
        reference.setBoolean('actorLocal', true);
        reference.performUpdate();
    }
}

function _handleUpdateFOW(profile, message) {
    const map = EntityManagers.get('map').find(message.getMapID());
    if (!map) return;

    if (message.getReset()) {
        if (profile.getRole() == Role.GM) {
            GameService.resetFOW(map);
        }
    } else {
        if (profile.getCurrentMap() == map.getID()) {
            GameService.setFOW(map, profile, message.getFOW());
        }
    }
}

function _handleSendChatMessage(profile, message) {
    ChatService.onMessage(profile, message.getMessage());
}

function _handlePing(profile, message) {
    MessageService.send(message, profile);
}

function _handleToggleModule(profile, message) {
    if (profile.getRole() == Role.GM) {
        ModuleService.toggleModule(message.getIdentifier(), message.getDisabled());
        MessageService.send(new SendNotification(I18N.get('notification.server.restartrequired', 'Server Restart Required!'), 10), profile);
    }
}

function _handleChangeConfig(profile, message) {
    if (profile.getRole() == Role.GM) {
        const def = CONFIG.getDefinition(message.getKey());
        if (def && def.clientAccessible) {
            //TODO: verify type (should probably happen in the set function?)
            CONFIG.set(message.getKey(), message.getValue());
            CONFIG.save(data => saveJsonFile('./' + PARAMETERS.datadir + '/config.json', data, true));

            // broadcast change to all clients
            MessageService.broadcast(message);

            // notify clients of required restart
            if (def.restartRequired) {
                MessageService.send(new SendNotification(I18N.get('notification.server.restartrequired', 'Server Restart Required!'), 10), profile);
            }
        }
    }
}

Events.on('recievedMessage', event => {
    const message = event.data.message;

    // get profile
    var profile = null;
    if (message.requiresAuthentication()) {
        profile = UserService.getProfileFor(event.data.ws);
        if (!profile) throw new Error('Not authenticated');
    }
    event.data.profile = profile;

    // get map
    var map = null;
    if (message.requiresMap()) {
        map = EntityManagers.get('map').find(profile.getCurrentMap());
        if (!map) throw new Error('No map loaded');
    }
    event.data.map = map;
}, false, 1000000);

Events.on('recievedMessage', event => {
    const message = event.data.message;
    const ws = event.data.ws;
    const profile = event.data.profile;
    const map = event.data.map;

    // handle message
    var handled = true;
    // Basic / Login Messages
    if (message instanceof RequestAccounts) {
        _handleRequestAccounts(ws, message);
    } else if (message instanceof SignIn) {
        _handleSignIn(ws, message);
    } else if (message instanceof SignOut) {
        _handleSignOut(profile, message);
    }
    // In Game Messages
    else if (message instanceof MovePlayerToMap) {
        _handleMovePlayerToMap(profile, message);
    } else if (message instanceof SelectedEntities) {
        _handleSelectedEntities(profile, message);
    } else if (message instanceof ActionCommand) {
        _handleActionCommand(profile, message);
    } else if (message instanceof PlayEffect) {
        _handlePlayEffect(profile, map, message);
    } else if (message instanceof SetPlayerColor) {
        _handleSetPlayerColor(profile, message);
    } else if (message instanceof AddEntities) {
        _handleAddEntities(profile, message);
    } else if (message instanceof RemoveEntity) {
        _handleRemoveEntity(profile, message);
    } else if (message instanceof UpdateEntityProperties) {
        _handleUpdateEntityProperties(profile, message);
    } else if (message instanceof CopyEntity) {
        _handleCopyEntity(profile, message);
    } else if (message instanceof MakeActorLocal) {
        _handleMakeActorLocal(profile, message);
    } else if (message instanceof UpdateFOW) {
        _handleUpdateFOW(profile, message);
    } else if (message instanceof SendChatMessage) {
        _handleSendChatMessage(profile, message);
    } else if (message instanceof Ping) {
        _handlePing(profile, message);
    } else if (message instanceof ToggleModule) {
        _handleToggleModule(profile, message);
    } else if (message instanceof ChangeConfig) {
        _handleChangeConfig(profile, message);
    } else if (message instanceof EntityLoading) {
        // discard client callbacks for now
    } else {
        handled = false;
    }

    if (handled) event.cancel();
}, false, 1000);
