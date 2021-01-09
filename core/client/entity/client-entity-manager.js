import { EntityManager } from '../../common/entity/entity-managers.js'
import { Entity } from '../../common/entity/entity.js';
import { AddEntity, RemoveEntity, UpdateEntityProperties } from '../../common/messages.js';
import { MessageService } from '../service/message-service.js';

export class ClientEntityManager extends EntityManager {
    type;
    entities;
    listeners;
    entityListeners;
    removalListeners;

    constructor(type) {
        super();

        this.type = type;
        this.entities = new Map();
        this.listeners = [];
        this.entityListeners = [];
        this.removalListeners = [];
    }

    find(id) {
        return this.entities.get(Number(id));
    }

    has(id) {
        return this.entities.has(Number(id));
    }

    all() { 
        return Array.from(this.entities.values()); //TODO: might need the readOnlyAll system from old client
    }

    map() {
        return this.entities; //TODO: should be an unmodifiable view
    }

    add(entity) { 
        if(!entity) return;
        if(!(entity instanceof Entity)) throw new Error('Object is no entity');
        if(entity.getType() !== this.type) throw new Error('Entity is of wrong type');

        const msg = new AddEntity(entity);
        MessageService.send(msg);
    }

    remove(id) { 
        const msg = new RemoveEntity(this.type, id);
        MessageService.send(msg);
    }

    updateProperties(id, map, accessLevel) { 
        const msg = new UpdateEntityProperties(this.type, id, map);
        MessageService.send(msg);
    }

    // Listener Methods
    addListener(listener) {
        this.listeners.push(listener);
    }

    addEntityListener(entityListener) {
        this.entityListeners.push(entityListener);
    }

    addRemovalListener(removalListener) {
        this.removalListeners.push(removalListener);
    }

    notifyListeners() {
        for(const listener of this.listeners) {
            listener();
        }
    }

    // Server Data Methods
    serverClearEntities() {
        this.entities.clear();

        this.notifyListeners();
    }

    serverAddEntity(entity) {
        this.entities.set(Number(entity.getID()), entity);
        
        this.notifyListeners();
        for(const entityListener of this.entityListeners) {
            entityListener(entity);
        }
    }

    serverRemoveEntity(id) {
        this.entities.delete(Number(id));

        this.notifyListeners();
        for(const removalListener of this.removalListeners) {
            removalListener(id);
        }
    }

    serverUpdateProperties(id, map) {
        const entity = this.find(id);
        if(!entity) return;

        for(const [key, value] of Object.entries(map)) {
            var ownProperty = entity.properties[key];
            if(ownProperty == null || ownProperty == undefined) {
                ownProperty = value.clone();
                entity.addPropertyIfAbsentOrWrong(key, ownProperty);
            }
            
            // transfer value
            //TODO: actual property methods
            if(ownProperty.type == value.type) {
                ownProperty.value = value.value;
            }
            
            // transfer access
            ownProperty.viewAccess = value.viewAccess;
            ownProperty.editAccess = value.editAccess;
        }
        
        this.notifyListeners();
        for(const entityListener of this.entityListeners) {
            entityListener(entity);
        }
    }
}
