import { EntityManager } from '../../common/entity/entity-managers.js'
import { Entity } from '../../common/entity/entity.js';
import { AddEntities, RemoveEntity, UpdateEntityProperties } from '../../common/messages.js';
import { MessageService } from '../service/message-service.js';

export class ClientEntityManager extends EntityManager {
    entities;

    constructor(name, type, entityDefinition, cb) {
        super(name, type);

        this.entities = {};
        if(cb) cb();
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
        if(entity.getType() !== this.getType()) throw new Error('Entity is of wrong type');

        const msg = new AddEntities(this.getName(), [entity]);
        MessageService.send(msg);
    }

    remove(id) { 
        const msg = new RemoveEntity(this.getName(), id);
        MessageService.send(msg);
    }

    updateProperties(id, map, accessLevel) { 
        const msg = new UpdateEntityProperties(this.getName(), id, map);
        MessageService.send(msg);
    }

    // Server Data Methods
    serverClearEntities() {
        this.entities = {};

        //TODO: this had a notifyListeners call, is a replacement needed?
    }

    serverAddEntity(entity) {
        this.entities[String(entity.getID())] = entity;
        
        this.triggerEvent('added', entity);
    }

    serverRemoveEntity(id) {
        const entity = this.entities[String(id)];
        delete this.entities[String(id)];

        this.triggerEvent('removed', entity);
    }

    serverUpdateProperties(id, map) {
        const entity = this.find(id);
        if(!entity) return;

        for(const [key, value] of Object.entries(map)) {
            entity.addPropertyIfAbsentOrWrong(key, value);
            
            // transfer value
            entity.setInternal(key, value);
        }
        
        this.triggerEvent('modified', entity);
    }
}
