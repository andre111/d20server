import { Connection } from '../connection.js';
import { ActionCommand, AddEntity, ChatEntries, ClearEntities, EnterGame, EnterMap, EntityLoading, PlayEffect, PlayerList, RemoveEntity, ResponseFail, ResponseOk, ServerDefinitions, UpdateEntityProperties } from '../../common/messages.js';
import { Events } from '../../common/events.js';
import { ServerData } from '../server-data.js';
import { StateLoading } from '../state/state-loading.js';
import { Client } from '../app.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { setDefinitions } from '../../common/definitions.js';
import { StateMain } from '../state/state-main.js';
import { CanvasWindowInfo } from '../canvas/window/canvas-window-info.js';
import { EffectRenderer } from '../renderer/effect-renderer.js';

export const MessageService = {
    recieve: function(msg) {
        if(msg instanceof ResponseOk) {
        } else if(msg instanceof ResponseFail) {
            new CanvasWindowInfo('Failed', msg.getDescription());
        } else if(msg instanceof EntityLoading) {
            Client.setState(new StateLoading(msg.getCount()));
        } else if(msg instanceof EnterGame) {
            ServerData.localProfile = msg.getProfile();
            ServerData.editKey = msg.getEditKey();
            Client.setState(new StateMain());
        } else if(msg instanceof ServerDefinitions) {
            setDefinitions(msg.getDefinitions());
            EntityManagers.createAll();
        } else if(msg instanceof ClearEntities) {
            EntityManagers.get(msg.getType()).serverClearEntities();
        } else if(msg instanceof AddEntity) {
            if(Client.getState() instanceof StateLoading) Client.getState().increaseCurrent();
            EntityManagers.get(msg.getType()).serverAddEntity(msg.getEntity());
        } else if(msg instanceof RemoveEntity) {
            EntityManagers.get(msg.getType()).serverRemoveEntity(msg.getID());
        } else if(msg instanceof UpdateEntityProperties) {
            EntityManagers.get(msg.getType()).serverUpdateProperties(msg.getID(), msg.getProperties());
        } else if(msg instanceof EnterMap) {
            //TODO: replace observable with event and use an actual class fot the event?
            const evt = {
                oldMapID: ServerData.currentMap.get(),
                newMapID: msg.getMapID()
            };
            ServerData.currentMap.set(msg.getMapID());
            Events.trigger('mapChange', evt);
        } else if(msg instanceof PlayerList) {
            var index = new Map();
            for(const profile of msg.getPlayers()) {
                index.set(profile.getID(), profile);

                // update localProfile
                if(ServerData.localProfile && ServerData.localProfile.getID() == profile.getID()) {
                    ServerData.localProfile = profile;
                }
            }
            ServerData.profiles.set(index);
        } else if(msg instanceof ActionCommand) {
            Events.trigger('actionCommand', msg);
        } else if(msg instanceof PlayEffect) {
            if(msg.isFocusCamera() && Client.getState() instanceof StateMain) {
                Client.getState().getCamera().setLocation(msg.getX(), msg.getY(), false);
            }
            EffectRenderer.addEffect(msg.getEffect(), msg.getX(), msg.getY(), msg.getRotation(), msg.getScale(), msg.isAboveOcclusion(), msg.getParameters());
        } else if(msg instanceof ChatEntries) {
            if(Client.getState() instanceof StateMain) {
                const tab = Client.getState().getTab('Chat');
                if(!msg.doAppend()) tab.clear();
                for(const entity of msg.getEntries()) {
                    tab.onMessage(entity, msg.isHistorical());
                }
            }
        } else {
            console.log('Recieved unsupported message: ', msg);
        }
    },

    send: function(msg) {
        Connection.send(msg);
    }
}