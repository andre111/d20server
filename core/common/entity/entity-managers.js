import { getDefinitions } from '../definitions.js';

export class EntityManager {
    find(id) { throw new Error('Cannot call abstract function'); }
    has(id) { throw new Error('Cannot call abstract function'); }
    all() { throw new Error('Cannot call abstract function'); }
    map() { throw new Error('Cannot call abstract function'); }

    add(entity) { throw new Error('Cannot call abstract function'); }
    remove(id) { throw new Error('Cannot call abstract function'); }
    updateProperties(id, map, accessLevel) { throw new Error('Cannot call abstract function'); }
}

var _entityManagerClass = null;
var _entityManagers = {};
export const EntityManagers = {
    init: function(entityManagerClass) {
        _entityManagerClass = entityManagerClass;
    },

    createAll: function() {
        _entityManagers = {};
        for(const [type, entityDefinition] of Object.entries(getDefinitions().getEntityDefinitions())) {
            EntityManagers.create(type, entityDefinition);
        }
    },
    
    get: function(type) {
        return _entityManagers[type];
    },

    create: function(type, entityDefinition) {
        if(_entityManagerClass == null) throw new Error('Cannot create EntityManager before initialization');

        _entityManagers[type] = new _entityManagerClass(type, entityDefinition);
    }
}
