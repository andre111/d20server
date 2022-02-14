import { Role } from '../common/constants.js';

export const ServerData = {
    localProfile: null,
    editKey: -1,
    profiles: new Map(),
    currentMap: 0,

    isGM: function () {
        return ServerData.localProfile && ServerData.localProfile.getRole() == Role.GM;
    }
}
