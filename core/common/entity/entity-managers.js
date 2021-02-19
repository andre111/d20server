import { getDefinitions } from '../definitions.js';

export class EntityManager {
    listeners = [];
    entityListeners = [];
    removalListeners = [];

    find(id) { throw new Error('Cannot call abstract function'); }
    has(id) { throw new Error('Cannot call abstract function'); }
    all() { throw new Error('Cannot call abstract function'); }
    map() { throw new Error('Cannot call abstract function'); }

    add(entity) { throw new Error('Cannot call abstract function'); }
    remove(id) { throw new Error('Cannot call abstract function'); }
    updateProperties(id, map, accessLevel) { throw new Error('Cannot call abstract function'); }
    
    // Listener Methods
    addListener(listener) {
        this.listeners.push(listener);
    }

    removeListener(listener) {
        const index = this.listeners.indexOf(listener);
        if(index >= 0) this.listeners.splice(index, 1);
    }

    addEntityListener(entityListener) {
        this.entityListeners.push(entityListener);
    }

    removeEntityListener(entityListener) {
        const index = this.entityListeners.indexOf(entityListener);
        if(index >= 0) this.entityListeners.splice(index, 1);
    }

    addRemovalListener(removalListener) {
        this.removalListeners.push(removalListener);
    }

    removeRemovalListener(removalListener) {
        const index = this.removalListeners.indexOf(removalListener);
        if(index >= 0) this.removalListeners.splice(index, 1);
    }

    notifyListeners() {
        for(const listener of this.listeners) {
            listener();
        }
    }
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

    create: function(type, entityDefinition) {
        if(_entityManagerClass == null) throw new Error('Cannot create EntityManager before initialization');

        _entityManagers[type] = new _entityManagerClass(type, entityDefinition);
    },
    
    get: function(type) {
        return _entityManagers[type];
    },

    getAll: function() {
        return Object.values(_entityManagers);
    }
}
