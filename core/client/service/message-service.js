import { Connection } from '../connection.js';
import { ActionCommand, AddEntity, ChatEntries, ClearEntities, EnterGame, EnterMap, EntityLoading, ModuleDefinitions, PlayEffect, PlayerList, RemoveEntity, ResponseFail, ResponseOk, SendNotification, ServerDefinitions, UpdateEntityProperties } from '../../common/messages.js';
import { Events } from '../../common/events.js';
import { ServerData } from '../server-data.js';
import { StateLoading } from '../state/state-loading.js';
import { Client } from '../app.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { setDefinitions } from '../../common/definitions.js';
import { StateMain } from '../state/state-main.js';
import { CanvasWindowText } from '../canvas/window/canvas-window-text.js';
import { EffectRenderer } from '../renderer/effect-renderer.js';
import { ModuleSettings } from '../settings/module-settings.js';

export const MessageService = {
    recieve: function(msg) {
        if(msg instanceof ResponseOk) {
        } else if(msg instanceof ResponseFail) {
            new CanvasWindowText('Failed', msg.getDescription());
        } else if(msg instanceof EntityLoading) {
            Client.setState(new StateLoading(msg.getCount()));
        } else if(msg instanceof EnterGame) {
            ServerData.localProfile = msg.getProfile();
            ServerData.editKey = msg.getEditKey();
            Client.setState(new StateMain());
        } else if(msg instanceof ServerDefinitions) {
            setDefinitions(msg.getDefinitions());
        } else if(msg instanceof ClearEntities) {
           const manager = EntityManagers.get(msg.getManager());
           if(manager) manager.serverClearEntities();
        } else if(msg instanceof AddEntity) {
            if(Client.getState() instanceof StateLoading) Client.getState().increaseCurrent();
            EntityManagers.getOrCreate(msg.getEntity().getManager(), msg.getEntity().getType()).serverAddEntity(msg.getEntity());
        } else if(msg instanceof RemoveEntity) {
            const manager = EntityManagers.get(msg.getManager());
            if(manager) manager.serverRemoveEntity(msg.getID());
        } else if(msg instanceof UpdateEntityProperties) {
            const manager = EntityManagers.get(msg.getManager());
            if(manager) manager.serverUpdateProperties(msg.getID(), msg.getProperties());
        } else if(msg instanceof EnterMap) {
            const data = {
                oldMapID: ServerData.currentMap,
                newMapID: msg.getMapID()
            };
            ServerData.currentMap = msg.getMapID();
            Events.trigger('mapChange', data);
        } else if(msg instanceof PlayerList) {
            var index = new Map();
            for(const profile of msg.getPlayers()) {
                index.set(profile.getID(), profile);

                // update localProfile
                if(ServerData.localProfile && ServerData.localProfile.getID() == profile.getID()) {
                    ServerData.localProfile = profile;
                }
            }
            ServerData.profiles = index;
            Events.trigger('profileListChange');
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
                tab.onMessages(msg.getEntries(), msg.isHistorical());
            }
        } else if(msg instanceof SendNotification) {
            if(Client.getState() instanceof StateMain) {
                Client.getState().getNotificationManager().addNotification(msg.getContent(), msg.getTime());
            }
        } else if(msg instanceof ModuleDefinitions) {
            ModuleSettings.onModuleDefinitions(msg.getModuleDefinitions());
        } else {
            const event = Events.trigger('customMessage', { message: msg }, true);
            if(!event.canceled) {
                throw new Error(`Recieved unsupported message: ${msg}`);
            }
        }
    },

    send: function(msg) {
        Connection.send(msg);
    }
}
