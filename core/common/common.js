// @ts-check
import { EntityManagers } from './entity/entity-managers.js';
import { ID } from './entity/id.js';

var server = true;
export const Common = {
    init: function (isServer, idProvider, entityManagerClass) {
        server = isServer;
        ID.init(idProvider);
        EntityManagers.init(entityManagerClass);
    },

    isServer: function () {
        return server;
    }
}

// Export some required classes / types so they get initialized
export { Entity } from './entity/entity.js';
export { Profile } from './profile.js';
export { Definitions } from './definitions.js';
import './entity/entity-logic.js';
import './scripting/scripting.js';
