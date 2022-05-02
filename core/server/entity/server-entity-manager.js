// @ts-check
import { EntityManager } from '../../common/entity/entity-managers.js';
import { Entity } from '../../common/common.js';
import { Access, Role } from '../../common/constants.js';
import { AddEntities, ClearEntities, RemoveEntity, UpdateEntityProperties } from '../../common/messages.js';
import { MessageService } from '../service/message-service.js';
import { UserService } from '../service/user-service.js';

import { chunk, fromJson, toJson } from '../../common/util/datautil.js';
import nedb from '@rmanibus/nedb'; // NOTE: This uses a special 'updated' nedb fork (with updated dependencies)
import fs from 'fs-extra';
import { PARAMETERS } from '../parameters.js';
import { Events } from '../../common/events.js';

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
        this.db = new nedb({ filename: './' + PARAMETERS.datadir + '/entity/' + name + '.db', autoload: true });
        this.db.persistence.setAutocompactionInterval(1000 * 60 * 60); // auto compact every hour to avoid files getting to large during long sessions
        this.db.find({}, (err, docs) => {
            for (const doc of docs) {
                this.entities[doc._id] = fromJson(doc.json);
                this.entities[doc._id].manager = this.getName();
                this.entities[doc._id].onAdd();
            }
            if (cb) cb();
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
        if (!(entity instanceof Entity)) throw new Error('Can only add instances of entity');
        if (entity.getType() != this.getType()) throw new Error('Entity is of wrong type');

        entity.manager = this.getName();
        entity.onAdd();

        const id = String(entity.getID());
        this.entities[id] = entity;
        if (this.saveEnabled) {
            this.saveOperations++;
            const doc = {
                _id: id,
                json: toJson(entity, false)
            };
            this.db.update({ _id: id }, doc, { upsert: true }, err => {
                this.saveOperations--;
                //TODO: error handler
            });
        }

        UserService.forEach(profile => {
            if (entity.canView(profile)) this.syncEntity(profile, entity);
        });

        this.triggerEvent('added', entity);
    }

    remove(id) {
        const entity = this.find(id);
        if (!entity) return;

        entity.onRemove();

        delete this.entities[String(id)];
        if (this.saveEnabled) {
            this.saveOperations++;
            this.db.remove({ _id: String(id) }, {}, err => {
                this.saveOperations--;
                //TODO: error handler
            });
        }

        UserService.forEach(profile => {
            MessageService.send(new RemoveEntity(this.getName(), id), profile);
        });

        this.triggerEvent('removed', entity);
    }

    updateProperties(id, map, accessLevel) {
        const entity = this.find(id);
        if (!entity) return;

        // keep track of all profiles that could see this entity
        var couldView = [];
        UserService.forEach(profile => {
            if (entity.canView(profile)) couldView.push(profile);
        });

        // transfer properties respecting access settings and keeping track of which changed
        // check properties first for any obviously invalid changes
        var propertiesToChange = {};
        for (const [key, value] of Object.entries(map)) {
            if (!entity.has(key)) continue; // server discards new/unknown properties from client
            if (!entity.isValidValue(key, value)) continue; // server discards properties with invalid value

            // transfer value
            if (entity.canEditProperty(key, accessLevel)) {
                propertiesToChange[key] = value;
            }
        }

        // call event
        const event = Events.trigger('modify_' + this.getType(), {
            entity: entity,
            propertiesToChange: propertiesToChange,
            accessLevel: accessLevel,
            manager: this
        }, true);
        if (event.canceled) return;

        // apply changes (checking again for invalid changes made by event callbacks)
        var changedProperties = {};
        for (const [key, value] of Object.entries(propertiesToChange)) {
            if (!entity.has(key)) continue; // server discards new/unknown properties from client
            if (!entity.isValidValue(key, value)) continue; // server discards properties with invalid value

            // transfer value
            if (entity.canEditProperty(key, accessLevel)) {
                try {
                    entity.setInternal(key, value);
                    changedProperties[key] = value;

                    const updated = entity.onPropertyChange(key);
                    for (const [ukey, uvalue] of Object.entries(updated)) {
                        changedProperties[ukey] = uvalue;
                    }
                } catch (error) {
                    //TODO: how to handle incorrect property updates
                    console.log(`Recieved invalid property value: ${error}`);
                }
            }
        }

        // save
        if (this.saveEnabled) {
            this.saveOperations++;
            const doc = {
                _id: String(id),
                json: toJson(entity, false)
            };
            this.db.update({ _id: String(id) }, doc, { upsert: true }, err => {
                this.saveOperations--;
                //TODO: error handler
            });
        }

        // transfer (depending on (changing) access: add, remove or only changed properties)
        UserService.forEach(profile => {
            if (entity.canView(profile) && !couldView.includes(profile)) {
                this.syncEntity(profile, entity);
            } else if (!entity.canView(profile) && couldView.includes(profile)) {
                MessageService.send(new RemoveEntity(this.getName(), id), profile);
            } else if (entity.canView(profile)) {
                MessageService.send(new UpdateEntityProperties(this.getName(), id, changedProperties), profile);
            }
        });

        this.triggerEvent('modified', entity);
    }

    canView(profile) {
        if (profile.role == Role.SYSTEM) return true;

        // global always true, contained return parentEntity.canView(profile)
        if (this.parentEntity) {
            // special case: maps -> only sync content of current map
            if (this.parentEntity.getType() == 'map') {
                return this.parentEntity.getID() == profile.getCurrentMap();
            }

            return this.parentEntity.canView(profile);
        } else {
            return true;
        }
    }

    canAddRemove(profile, entity) {
        const accessLevel = entity.getAccessLevel(profile);
        return Access.matches(this.addRemoveAccess, accessLevel);
    }

    getAccessibleCount(profile) {
        if (!this.canView(profile)) return 0;

        var count = 0;
        for (const entity of Object.values(this.entities)) {
            if (entity.canView(profile)) count++;
        }
        return count;
    }

    fullSync(profile) {
        if (!this.canView(profile)) return;

        MessageService.send(new ClearEntities(this.getName(), this.getType()), profile);

        // collect entities
        var entitiesToSync = [];
        for (const entity of Object.values(this.entities)) {
            if (entity.canView(profile)) entitiesToSync.push(entity);
        }
        if (entitiesToSync.length == 0) return;

        // send them in ONE message
        // TODO: maybe splitting them up into batches of X would be better -> try to find a good balance
        //MessageService.send(new AddEntities(this.getName(), entitiesToSync), profile);
        for (const split of chunk(entitiesToSync, 20)) {
            MessageService.send(new AddEntities(this.getName(), split), profile);
        }

        // iterate contained managers and perform full sync
        for (const containedEntityType of entitiesToSync[0].getDefinition().settings.containedEntities) {
            for (const entity of entitiesToSync) {
                const manager = entity.getContainedEntityManager(containedEntityType);
                if (manager) manager.fullSync(profile);
            }
        }
    }

    syncEntity(profile, entity) {
        MessageService.send(new AddEntities(this.getName(), [entity]), profile);

        // iterate contained managers and perform full sync
        for (const containedEntityType of entity.getDefinition().settings.containedEntities) {
            const manager = entity.getContainedEntityManager(containedEntityType);
            if (manager) manager.fullSync(profile);
        }
    }

    removeAll(predicate) {
        for (const entity of Array.from(Object.values(this.entities))) {
            if (predicate(entity)) this.remove(entity.getID());
        }
    }

    setSaveEnabled(saveEnabled) {
        this.saveEnabled = saveEnabled;

        // perform full save on reenable
        if (saveEnabled) {
            for (const [id, entity] of Object.entries(this.entities)) {
                const doc = {
                    _id: id,
                    json: toJson(entity, false)
                };

                this.db.update({ _id: id }, doc, { upsert: true }, err => { }); //TODO: error handling
            }
            this.db.persistence.compactDatafile();
        }
    }

    onDelete() {
        // delete db file
        if (fs.existsSync('./data/entity/' + this.getName() + '.db')) {
            fs.remove('./data/entity/' + this.getName() + '.db');
        }
    }

    isSaving() {
        return this.saveOperations > 0 || !this.db.executor.queue.idle();
    }
}
