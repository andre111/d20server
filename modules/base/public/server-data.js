ServerData = {
    localProfile: null,
    profiles: {},
    currentMap: 0,
    
    isGM: function() {
        return ServerData.localProfile != null && ServerData.localProfile != undefined && ServerData.localProfile.role == Role.GM;
    }
}
