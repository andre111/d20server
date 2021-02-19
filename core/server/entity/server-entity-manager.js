import { EntityManager } from '../../common/entity/entity-managers.js';
import { Entity } from '../../common/common.js';
import { Access } from '../../common/constants.js';
import { AddEntity, ClearEntities, RemoveEntity, UpdateEntityProperties } from '../../common/messages.js';
import { MessageService } from '../service/message-service.js';
import { SaveService } from '../service/save-service.js';
import { UserService } from '../service/user-service.js';
import { backupJsonAsync, readJson, saveJsonAsync } from '../util/fileutil.js';

export class ServerEntityManager extends EntityManager {
    type;
    synched;
    addRemoveAccess;

    entities;

    saveEnabled = true;

    constructor(type, entityDefinition) {
        super();

        this.type = type;
        this.synched = entityDefinition.settings.synched;
        this.addRemoveAccess = entityDefinition.settings.addRemoveAccess;

        // load entities (into map)
        this.entities = readJson('entity.'+type);
        if(!this.entities) this.entities = {};
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
        if(!(entity instanceof Entity)) throw new Error('Can only add instances of entity');
        if(entity.getType() != this.type) throw new Error('Entity is of wrong type');

        this.entities[String(entity.getID())] = entity;
        if(this.saveEnabled) SaveService.requestSave(this.type);

        UserService.forEach(profile => {
            if(entity.canView(profile)) MessageService.send(new AddEntity(entity), profile);
        });

        this.notifyListeners();
        for(const entityListener of this.entityListeners) {
            entityListener(entity);
        }
    }

    remove(id) {
        const entity = this.find(id);
        if(!entity) return;

        delete this.entities[String(id)];
        if(this.saveEnabled) SaveService.requestSave(this.type);

        UserService.forEach(profile => {
            MessageService.send(new RemoveEntity(this.type, id), profile);
        });

        this.notifyListeners();
        for(const removalListener of this.removalListeners) {
            removalListener(id, entity);
        }
    }

    updateProperties(id, map, accessLevel) {
        const entity = this.find(id);
        if(!entity) return;

        // keep track of all profiles that could see this entity
        var couldView = [];
        UserService.forEach(profile => {
            if(entity.canView(profile)) couldView.push(profile);
        });

        // transfer properties respecting access settings and keeping track of which changed
        var changedProperties = {};
        for(const [key, value] of Object.entries(map)) {
            const ownProperty = entity.properties[key];
            if(!ownProperty) continue; // server discards new/unknown properties from client
            if(!value.hasValidValue()) continue; // server discards properties with invalid value

            // transfer value
            if(Access.matches(ownProperty.getEditAccess(), accessLevel)) {
                try {
                    value.transferTo(ownProperty);
                    changedProperties[key] = ownProperty;

                    const updated = entity.onPropertyChange(key, ownProperty);
                    for(const [ukey, uvalue] of Object.entries(updated)) {
                        changedProperties[ukey] = uvalue;
                    }
                } catch(error) {
                    //TODO: how to handle incorrect property updates
                    console.log(`Recieved invalid property value: ${error}`);
                }
            }

            // transfer access (GM only, and do not allow changing of SYSTEM level access)
            if(accessLevel == Access.GM) {
                if(value.getViewAccess() != Access.SYSTEM && ownProperty.getViewAccess() != Access.SYSTEM && value.getViewAccess() != ownProperty.getViewAccess()) {
                    ownProperty.setViewAccess(value.getViewAccess());
                    changedProperties[key] = ownProperty;
                }
                if(value.getEditAccess() != Access.SYSTEM && ownProperty.getEditAccess() != Access.SYSTEM && value.getEditAccess() != ownProperty.getEditAccess()) {
                    ownProperty.setEditAccess(value.getEditAccess());
                    changedProperties[key] = ownProperty;
                }
            }
        }
        
        // save and transfer (depending on (changing) access: add, remove or only changed properties)
        if(this.saveEnabled) SaveService.requestSave(this.type);
        UserService.forEach(profile => {
            if(entity.canView(profile) && !couldView.includes(profile)) {
                MessageService.send(new AddEntity(entity), profile);
            } else if(!entity.canView(profile) && couldView.includes(profile)) {
                MessageService.send(new RemoveEntity(this.type, id), profile);
            } else if(entity.canView(profile)) {
                MessageService.send(new UpdateEntityProperties(this.type, id, changedProperties), profile);
            }
        });

        this.notifyListeners();
        for(const entityListener of this.entityListeners) {
            entityListener(entity);
        }
    }

    canAddRemove(profile, entity) {
        const accessLevel = entity.getAccessLevel(profile);
        return Access.matches(this.addRemoveAccess, accessLevel);
    }

    getAccessibleCount(profile) {
        var count = 0;
        for(const entity of Object.values(this.entities)) {
            if(entity.canView(profile)) count++;
        }
        return count;
    }

    fullSync(profile) {
        MessageService.send(new ClearEntities(this.type), profile);
        for(const entity of Object.values(this.entities)) {
            if(entity.canView(profile)) MessageService.send(new AddEntity(entity), profile);
        }
    }

    removeAll(predicate) {
        for(const entity of Array.from(Object.values(this.entities))) {
            if(predicate(entity)) this.remove(entity.getID());
        }
    }

    setSaveEnabled(saveEnabled) {
        this.saveEnabled = saveEnabled;
        if(saveEnabled) {
            SaveService.requestSave(this.type);
        }
    }

    async _performSave(backup) {
		// called from (async) save service
        if(backup) {
            await backupJsonAsync('entity.'+this.type);
        }
        await saveJsonAsync('entity.'+this.type, this.entities);
    }
}
