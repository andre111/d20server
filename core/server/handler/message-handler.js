import { ChatService } from '../service/chat-service.js';
import { MessageService } from '../service/message-service.js';
import { UserService } from '../service/user-service.js';

import { EntityManagers } from '../../common/entity/entity-managers.js';
import { ActionCommand, AddEntity, EntityLoading, MovePlayerToMap, Ping, PlayEffect, PlayerList, RemoveEntity, RequestAccounts, ResponseFail, ResponseOk, SelectedTokens, SendChatMessage, SetPlayerColor, SignIn, SignOut, UpdateEntityProperties } from '../../common/messages.js';
import { Role } from '../../common/constants.js';
import { GameService } from '../service/game-service.js';
import { VERSION } from '../version.js';

function _handleRequestAccounts(ws, message) {
    MessageService._send(new PlayerList(UserService.getAllProfiles()), ws);
}

function _handleSignIn(ws, message) {
    // check version
    if(message.getAppVersion() != VERSION) {
        MessageService._send(new ResponseFail('SignIn', 'Version not matching server.'), ws);
        return;
    }

    // remove outer whitespace
    const username = message.getUsername().trim();
    const accessKey = message.getPassword().trim();

    // find profile and verify access key
    var profile = UserService.findByUsername(username);
    if(profile && !UserService.checkAccessKey(profile, accessKey)) profile = null;
    if(!profile) {
        MessageService._send(new ResponseFail('SignIn', 'Incorrect Username or Access Key.'), ws);
        return;
    }

    // perform sign in
    MessageService._send(new ResponseOk('SignIn'));
    UserService._onSignIn(profile, ws);
}

function _handleSignOut(profile, message) {
    UserService._onSignOut(profile);
}

function _handleMovePlayerToMap(profile, message) {
    const mapID = message.getMapID();
    const profileID = message.getPlayerID();
    if(EntityManagers.get('map').has(mapID)) {
        if(profileID == 0) {
            if(profile.getRole() != Role.GM) return;

            // set player map id and reset overridden values for all non gms
            UserService.forEach(otherProfile => {
                if(otherProfile.getRole() != Role.GM) {
                    otherProfile.setCurrentMap(mapID);
                    UserService.addAndSave(otherProfile);
                }
            });
            
            // (re)load maps for clients
            GameService.reloadMaps();
        } else {
            if(profile.getRole() == Role.GM || (profileID == profile.getID() && EntityManagers.get('map').find(mapID).prop('playersCanEnter').getBoolean())) {
                // set player override map id and (re)load map
                const otherProfile = UserService.getProfile(profileID);
                if(otherProfile) {
                    otherProfile.setCurrentMap(mapID);
                    GameService.reloadMaps(otherProfile);
                    UserService.addAndSave(otherProfile);
                }
            }
        }
    }
}

function _handleSelectedTokens(profile, message) {
    var selectedTokens = message.getSelectedTokens();
    if(!selectedTokens) selectedTokens = [];

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

function _handleAddEntity(profile, message) {
    // search for manager, check access and reset id before adding if valid request
    const manager = EntityManagers.get(message.getType());
    if(manager) {
        const entity = message.getEntity();
        if(manager.canAddRemove(profile, entity)) {
            entity.resetID();
            manager.add(entity);
        }
    }
}

function _handleRemoveEntity(profile, message) {
    // search for entity, check access and delete if valid request
    const manager = EntityManagers.get(message.getType());
    if(manager) {
        const entity = manager.find(message.getID());
        if(entity && entity.canEdit(profile) && manager.canAddRemove(profile, entity)) {
            manager.remove(entity.getID());
        }
    }
}

function _handleUpdateEntityProperties(profile, message) {
    // search for entity, check access and update if valid request
    const manager = EntityManagers.get(message.getType());
    if(manager) {
        const entity = manager.find(message.getID());
        if(entity && entity.canEdit(profile)) {
            manager.updateProperties(entity.getID(), message.getProperties(), entity.getAccessLevel(profile));
        }
    }
}

function _handleSendChatMessage(profile, message) {
    ChatService.onMessage(profile, message.getMessage());
}

function _handlePing(profile, message) {
    MessageService.send(message, profile);
}

export class MessageHandler {
    static handle(ws, message) {
        // get profile
        var profile = null;
        if(message.requiresAuthentication()) {
            profile = UserService.getProfileFor(ws);
            if(!profile) throw new Error('Not authenticated');
        }

        // get map
        var map = null;
        if(message.requiresMap()) {
            map = EntityManagers.get('map').find(profile.getCurrentMap());
            if(!map) throw new Error('No map loaded');
        }

        // handle message
        // Basic / Login Messages
        if(message instanceof RequestAccounts) {
            _handleRequestAccounts(ws, message);
        } else if(message instanceof SignIn) {
            _handleSignIn(ws, message);
        } else if(message instanceof SignOut) {
            _handleSignOut(profile, message);
        }
        // In Game Messages
        else if(message instanceof MovePlayerToMap) {
            _handleMovePlayerToMap(profile, message);
        } else if(message instanceof SelectedTokens) {
            _handleSelectedTokens(profile, message);
        } else if(message instanceof ActionCommand) {
            _handleActionCommand(profile, message);
        } else if(message instanceof PlayEffect) {
            _handlePlayEffect(profile, map, message);
        } else if(message instanceof SetPlayerColor) {
            _handleSetPlayerColor(profile, message);
        } else if(message instanceof AddEntity) {
            _handleAddEntity(profile, message);
        } else if(message instanceof RemoveEntity) {
            _handleRemoveEntity(profile, message);
        } else if(message instanceof UpdateEntityProperties) {
            _handleUpdateEntityProperties(profile, message);
        } else if(message instanceof SendChatMessage) {
            _handleSendChatMessage(profile, message);
        } else if(message instanceof Ping) {
            _handlePing(profile, message);
        } else if(message instanceof EntityLoading) {
			// discard client callbacks for now
        } else {
            throw new Error(`Recieved unhandled message: ${message}`);
        }
    }
}
