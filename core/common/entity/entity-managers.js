import { getDefinitions } from '../definitions.js';
import { Entity } from '../common.js';
import { Events } from '../events.js';

export class EntityManager {
    #name;
    #type;
    #parentEntity;

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

    canView(profile) { return true; }

    onDelete() {};

    // parent entity
    set parentEntity(e) {
        if(!(e instanceof Entity)) throw new Error('Invalid parent entity');
        this.#parentEntity = e;
    }

    get parentEntity() {
        return this.#parentEntity;
    }

    // event methods
    triggerEvent(name, entity) {
        const data = {
            entity: entity,
            manager: this
        };

        Events.trigger(name+'_'+this.getType(), data);
        Events.trigger('any_'+this.getType(), data);
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
    },

    findEntity(path) {
        const managerName = path.substring(0, path.lastIndexOf('-'));
        const entityID = path.substring(path.lastIndexOf('-')+1);

        const manager = EntityManagers.get(managerName);
        if(!manager) return null;
        return manager.find(entityID);
    }
}
