import { getDefinitions } from '../definitions.js';

export class EntityManager {
    #name;
    #type;

    listeners = [];
    entityListeners = [];
    removalListeners = [];

    constructor(name, type) {
        this.#name = name;
        this.#type = type;
    }

    getName() {
        return this.#name;
    }

    getType() {
        return this.#type;
    }

    find(id) { throw new Error('Cannot call abstract function'); }
    has(id) { throw new Error('Cannot call abstract function'); }
    all() { throw new Error('Cannot call abstract function'); }
    map() { throw new Error('Cannot call abstract function'); }

    add(entity) { throw new Error('Cannot call abstract function'); }
    remove(id) { throw new Error('Cannot call abstract function'); }
    updateProperties(id, map, accessLevel) { throw new Error('Cannot call abstract function'); }

    onDelete() {};
    
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

var _total = 0;
var _loaded = 0;
var _loadCB;

export const EntityManagers = {
    init: function(entityManagerClass) {
        _entityManagerClass = entityManagerClass;
    },

    createAll: function(cb) {
        _entityManagers = {};
        _total = Object.keys(getDefinitions().getEntityDefinitions()).length;
        _loaded = 0;
        _loadCB = () => {
            _loaded++;
            if(_loaded == _total && cb) cb();
        };

        for(const [type, entityDefinition] of Object.entries(getDefinitions().getEntityDefinitions())) {
            if(entityDefinition.settings.global) {
                EntityManagers.create(type, type, _loadCB);
            } else {
                _loadCB();
            }
        }
    },

    create: function(name, type, cb) {
        if(_entityManagerClass == null) throw new Error('Cannot create EntityManager before initialization');

        const entityDefinition = getDefinitions().getEntityDefinitions()[type];
        if(!entityDefinition) throw new Error(`No definition for type: ${type}`);

        _entityManagers[name] = new _entityManagerClass(name, type, entityDefinition, cb);
    },
    
    get: function(name) {
        return _entityManagers[name];
    },

    getOrCreate: function(name, type) {
        type = type ?? name;
        if(!_entityManagers[name]) this.create(name, type);
        return _entityManagers[name];
    },

    getAll: function() {
        return Object.values(_entityManagers);
    },

    delete(name) {
        if(_entityManagers[name]) {
            _entityManagers[name].onDelete();
            delete _entityManagers[name];
        }
    }
}
