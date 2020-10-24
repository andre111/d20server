MessageService = {
    recieve: function(msg) {
        switch(msg.msg) {
            case "ResponseOk":
                break;
            case "ResponseFail":
                break;
            //TODO: messages should probably not all be handled here?
            case "EntityLoading":
                setState(StateLoading);
                break;
            case "EnterGame":
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
                ServerData.currentMap = msg.mapID; //TODO: might need the observed system from current client
                console.log("EnterMap: "+msg.mapID);
                break;
            default:
                break;
        }
    },
    
    send: function(msg) {
        Connection.send(msg);
    }
}
