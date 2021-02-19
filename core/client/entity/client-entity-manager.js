import { EntityManager } from '../../common/entity/entity-managers.js'
import { Entity } from '../../common/entity/entity.js';
import { AddEntity, RemoveEntity, UpdateEntityProperties } from '../../common/messages.js';
import { MessageService } from '../service/message-service.js';

export class ClientEntityManager extends EntityManager {
    type;
    entities;

    constructor(type, entityDefinition) {
        super();

        this.type = type;
        this.entities = {};
    }

    find(id) {
        return this.entities[String(id)];
    }

    has(id) {
        const entity = this.entities[String(id)]
        return entity != null && entity != undefined;
    }

    all() { 
        return Object.values(this.entities); //TODO: might need the readOnlyAll system from old client
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

    // Server Data Methods
    serverClearEntities() {
        this.entities = {};

        this.notifyListeners();
    }

    serverAddEntity(entity) {
        this.entities[String(entity.getID())] = entity;
        
        this.notifyListeners();
        for(const entityListener of this.entityListeners) {
            entityListener(entity);
        }
    }

    serverRemoveEntity(id) {
        const entity = this.entities[String(id)];
        delete this.entities[String(id)];

        this.notifyListeners();
        for(const removalListener of this.removalListeners) {
            removalListener(id, entity);
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
