import { EntityManager, EntityManagers } from '../../common/entity/entity-managers.js';
import { Entity } from '../../common/common.js';
import { Access } from '../../common/constants.js';
import { AddEntity, ClearEntities, RemoveEntity, UpdateEntityProperties } from '../../common/messages.js';
import { MessageService } from '../service/message-service.js';
import { UserService } from '../service/user-service.js';

import { fromJson, toJson } from '../../common/util/datautil.js';
import nedb from '@rmanibus/nedb'; // NOTE: This uses a special 'updated' nedb fork (with updated dependencies)
import fs from 'fs-extra';

export class ServerEntityManager extends EntityManager {
    synched;
    addRemoveAccess;

    entities;
    db;

    saveEnabled = true;
    saveOperations = 0;

    constructor(name, type, entityDefinition, cb) {
        super(name, type);

        this.synched = entityDefinition.settings.synched;
        this.addRemoveAccess = entityDefinition.settings.addRemoveAccess;

        // load entities (into map)
        this.entities = {};
        this.db = new nedb({ filename: './data/entity/'+name+'.db', autoload: true });
        this.db.persistence.setAutocompactionInterval(1000 * 60 * 60); // auto compact every hour to avoid files getting to large during long sessions
        this.db.find({}, (err, docs) => {
            for(const doc of docs) {
                this.entities[doc._id] = fromJson(doc.json);
                this.entities[doc._id].onAdd();
            }
            if(cb) cb();
        });
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
        if(entity.getType() != this.getType()) throw new Error('Entity is of wrong type');

        entity.manager = this.getName();
        entity.onAdd();

        const id = String(entity.getID());
        this.entities[id] = entity;
        if(this.saveEnabled) {
            this.saveOperations++;
            const doc =  {
                _id: id,
                json: toJson(entity, false, false)
            };
            this.db.update({ _id: id }, doc, { upsert: true }, err => {
                this.saveOperations--;
                //TODO: error handler
            }); 
        }

        UserService.forEach(profile => {
            if(entity.canView(profile)) this.syncEntity(profile, entity);
        });

        this.notifyListeners();
        for(const entityListener of this.entityListeners) {
            entityListener(entity);
        }
    }

    remove(id) {
        const entity = this.find(id);
        if(!entity) return;

        entity.onRemove();

        delete this.entities[String(id)];
        if(this.saveEnabled) {
            this.saveOperations++;
            this.db.remove({ _id: String(id)}, {}, err => {
                this.saveOperations--;
                //TODO: error handler
            });
        }

        UserService.forEach(profile => {
            MessageService.send(new RemoveEntity(this.getName(), id), profile);
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
            if(!entity.has(key)) continue; // server discards new/unknown properties from client
            if(!entity.isValidValue(key, value)) continue; // server discards properties with invalid value

            // transfer value
            if(entity.canEditProperty(key, accessLevel)) {
                try {
                    entity.setInternal(key, value);
                    changedProperties[key] = value;

                    const updated = entity.onPropertyChange(key);
                    for(const [ukey, uvalue] of Object.entries(updated)) {
                        changedProperties[ukey] = uvalue;
                    }
                } catch(error) {
                    //TODO: how to handle incorrect property updates
                    console.log(`Recieved invalid property value: ${error}`);
                }
            }
        }

        // save
        if(this.saveEnabled) {
            this.saveOperations++;
            const doc =  {
                _id: String(id),
                json: toJson(entity, false, false)
            };
            this.db.update({ _id: String(id) }, doc, { upsert: true }, err => {
                this.saveOperations--;
                //TODO: error handler
            });
        }
        
        // transfer (depending on (changing) access: add, remove or only changed properties)
        UserService.forEach(profile => {
            if(entity.canView(profile) && !couldView.includes(profile)) {
                this.syncEntity(profile, entity);
            } else if(!entity.canView(profile) && couldView.includes(profile)) {
                MessageService.send(new RemoveEntity(this.getName(), id), profile);
            } else if(entity.canView(profile)) {
                MessageService.send(new UpdateEntityProperties(this.getName(), id, changedProperties), profile);
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
        MessageService.send(new ClearEntities(this.getName(), this.getType()), profile);
        for(const entity of Object.values(this.entities)) {
            if(entity.canView(profile)) this.syncEntity(profile, entity);
        }
    }

    syncEntity(profile, entity) {
        MessageService.send(new AddEntity(entity), profile);

        // iterate contained managers and perform full sync
        for(const containedEntityType of entity.getDefinition().settings.containedEntities) {
            const manager = EntityManagers.get(entity.getContainedEntityManagerName(containedEntityType));
            if(manager) manager.fullSync(profile);
        }
    }

    removeAll(predicate) {
        for(const entity of Array.from(Object.values(this.entities))) {
            if(predicate(entity)) this.remove(entity.getID());
        }
    }

    setSaveEnabled(saveEnabled) {
        this.saveEnabled = saveEnabled;

        // perform full save on reenable
        if(saveEnabled) {
            for(const [id, entity] of Object.entries(this.entities)) {
                const doc = {
                    _id: id,
                    json: toJson(entity, false, false)
                };
        
                this.db.update({ _id: id }, doc, { upsert: true }, err => {}); //TODO: error handling
            }
            this.db.persistence.compactDatafile();
        }
    }

    onDelete() {
        // delete db file
        if(fs.existsSync('./data/entity/'+this.getName()+'.db')) {
            fs.remove('./data/entity/'+this.getName()+'.db');
        }
    }

    isSaving() {
        return this.saveOperations > 0 || !this.db.executor.queue.idle();
    }
}
