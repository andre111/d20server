// @ts-check
import { Connection } from '../connection.js';
import { ActionCommand, AddEntities, ChangeConfig, ChatEntries, ClearEntities, EnterGame, EnterMap, EntityLoading, ModuleDefinitions, PlayEffect, PlayerList, RemoveEntity, ResponseFail, ResponseOk, SendNotification, ServerDefinitions, UpdateEntityProperties } from '../../common/messages.js';
import { Events } from '../../common/events.js';
import { ServerData } from '../server-data.js';
import { StateLoading } from '../state/state-loading.js';
import { Client } from '../client.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { setDefinitions } from '../../common/definitions.js';
import { StateMain } from '../state/state-main.js';
import { CanvasWindowText } from '../canvas/window/canvas-window-text.js';
import { EffectRenderer } from '../renderer/effect-renderer.js';
import { ModuleSettings } from '../settings/module-settings.js';
import { CONFIG } from '../../common/config.js';

Events.on('recievedMessage', event => {
    const msg = event.data.message;

    var handled = true;
    if (msg instanceof ResponseOk) {
    } else if (msg instanceof ResponseFail) {
        new CanvasWindowText(null, 'Failed', msg.getDescription());
    } else if (msg instanceof EntityLoading) {
        Client.setState(new StateLoading(msg.getCount()));
    } else if (msg instanceof EnterGame) {
        ServerData.localProfile = msg.getProfile();
        ServerData.editKey = msg.getEditKey();
        Client.setState(new StateMain());
    } else if (msg instanceof ServerDefinitions) {
        setDefinitions(msg.getDefinitions());
    } else if (msg instanceof ClearEntities) {
        EntityManagers.getOrCreate(msg.getManager(), msg.getType()).serverClearEntities();
    } else if (msg instanceof AddEntities) {
        const manager = EntityManagers.getOrCreate(msg.getManager(), msg.getEntities()[0].getType());
        for (const entity of msg.getEntities()) {
            manager.serverAddEntity(entity);
        }
        if (Client.getState() instanceof StateLoading) Client.getState().increaseCurrent(msg.getEntities().length);
    } else if (msg instanceof RemoveEntity) {
        const manager = EntityManagers.get(msg.getManager());
        if (manager) manager.serverRemoveEntity(msg.getID());
    } else if (msg instanceof UpdateEntityProperties) {
        const manager = EntityManagers.get(msg.getManager());
        if (manager) manager.serverUpdateProperties(msg.getID(), msg.getProperties());
    } else if (msg instanceof EnterMap) {
        const data = {
            oldMapID: ServerData.currentMap,
            newMapID: msg.getMapID(),
            newFOW: msg.getFOW()
        };
        ServerData.currentMap = msg.getMapID();
        Events.trigger('mapChange', data);
    } else if (msg instanceof PlayerList) {
        var index = new Map();
        for (const profile of msg.getPlayers()) {
            index.set(profile.getID(), profile);

            // update localProfile
            if (ServerData.localProfile && ServerData.localProfile.getID() == profile.getID()) {
                ServerData.localProfile = profile;
            }
        }
        ServerData.profiles = index;
        Events.trigger('profileListChange');
    } else if (msg instanceof ActionCommand) {
        Events.trigger('actionCommand', msg);
    } else if (msg instanceof PlayEffect) {
        if (msg.isFocusCamera() && Client.getState() instanceof StateMain) {
            Client.getState().getCamera().setLocation(msg.getX(), msg.getY(), false);
        }
        EffectRenderer.addEffect(msg.getEffect(), msg.getX(), msg.getY(), msg.getRotation(), msg.getScale(), msg.isAboveOcclusion(), msg.getParameters());
    } else if (msg instanceof ChatEntries) {
        if (Client.getState() instanceof StateMain) {
            const tab = Client.getState().getTab('Chat');
            if (!msg.doAppend()) tab.clear();
            tab.onMessages(msg.getEntries(), msg.isHistorical());
        }
    } else if (msg instanceof SendNotification) {
        if (Client.getState() instanceof StateMain) {
            Client.getState().getNotificationManager().addNotification(msg.getContent(), msg.getTime());
        }
    } else if (msg instanceof ModuleDefinitions) {
        ModuleSettings.onModuleDefinitions(msg.getModuleDefinitions(), msg.getDisabledModules());
    } else if (msg instanceof ChangeConfig) {
        CONFIG.set(msg.getKey(), msg.getValue());
    } else {
        handled = false;
    }

    if (handled) event.cancel();
}, false, 1000);

export const MessageService = {
    send: function (msg) {
        Connection.send(msg);
    }
}
