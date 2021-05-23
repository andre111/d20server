import { EntityManagers } from './entity/entity-managers.js';
import { ID } from './entity/id.js';

export const Common = {
    init: function(idProvider, entityManagerClass) {
        ID.init(idProvider);
        EntityManagers.init(entityManagerClass);
    }
}

// Export some required classes / types so they get initialized
export { Entity } from './entity/entity.js';
export { Profile } from './profile.js';
export { Definitions } from './definitions.js';
import './entity/entity-logic.js';
