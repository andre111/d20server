MessageService = {
    recieve: function(msg) {
        switch(msg.msg) {
            case "ResponseOk":
                break;
            case "ResponseFail":
                if(msg.to == "SignIn") new CanvasWindowInfo("Sign In failed", msg.description);
                break;
            //TODO: messages should probably not all be handled here?
            case "EntityLoading":
                setState(StateLoading);
                _g.currentState.amount = msg.count;
                break;
            case "EnterGame":
                ServerData.localProfile = msg.profile;
                setState(StateMain);
                break;
            case "ServerDefinitions":
                EntityManagers.init(msg.definitions);
                break;
            case "ClearEntities":
                EntityManagers.get(msg.type).serverClearEntities();
                break;
            case "AddEntity":
                if(_g.currentState == StateLoading) _g.currentState.increase();
                EntityManagers.get(msg.type).serverAddEntity(msg.entity);
                break;
            case "RemoveEntity":
                EntityManagers.get(msg.type).serverRemoveEntity(msg.id);
                break;
            case "UpdateEntityProperties":
                EntityManagers.get(msg.type).serverUpdateProperties(msg.id, msg.properties);
                break;
            //
            case "EnterMap":
                //TODO: replace observable with event
                var evt = {
                    oldMapID: ServerData.currentMap.get(),
                    newMapID: msg.mapID
                };
                ServerData.currentMap.set(msg.mapID);
                console.log("EnterMap: "+msg.mapID);
                Events.trigger("mapChange", evt);
                break;
            case "PlayerList":
                var index = new Map();
                for(var profile of msg.players) {
                    index.set(profile.id, profile);
                    
                    // update localProfile
                    if(ServerData.localProfile && profile.id == ServerData.localProfile.id) {
                        ServerData.localProfile = profile;
                    }
                }
                ServerData.profiles.set(index);
                break;
            case "ActionCommand":
                Events.trigger("actionCommand", msg);
                break;
            case "PlayEffect":
                if(msg.focusCamera) {
                    StateMain.camera.setLocation(msg.x, msg.y, false);
                }
                EffectRenderer.addEffect(msg.effect, msg.x, msg.y, msg.rotation, msg.scale, msg.aboveOcclusion, msg.parameters);
                break;
            case "ChatEntries":
                if(!msg.append) {
                    SidepanelManager.getTab("chat").clear();
                }
                for(var entry of msg.entries) {
                    SidepanelManager.getTab("chat").onMessage(entry, msg.historical);
                }
                break;
            default:
                break;
        }
    },
    
    send: function(msg) {
        Connection.send(msg);
    }
}
