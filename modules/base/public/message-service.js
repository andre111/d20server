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
                ServerData.currentMap.set(msg.mapID);
                console.log("EnterMap: "+msg.mapID);
                break;
            case "ActionCommand":
                switch(msg.command) {
                case "SHOW_IMAGE":
                    new CanvasWindowImage(msg.id);
                    break;
                //TODO...
                }
                break;
            case "PlayEffect":
                if(msg.focusCamera) {
                    camera.setLocation(msg.x, msg.y, false);
                }
                EffectRenderer.addEffect(msg.effect, msg.x, msg.y, msg.rotation, msg.scale, msg.aboveOcclusion, msg.parameters);
                break;
            default:
                break;
        }
    },
    
    send: function(msg) {
        Connection.send(msg);
    }
}
