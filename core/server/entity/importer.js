import path from 'path';
import { existsSync } from 'fs';
import fs from 'fs-extra';

import { readJsonFile } from '../util/fileutil.js';

import { EntityManagers } from '../../common/entity/entity-managers.js';
import { Entity } from '../../common/common.js';

function importEntities(directory, overwriteExisting, nameBased, type, modifier) {
    console.log(`Importing ${type}...`);
    var entityMap = {}; // keeps track of name => entity mapping (for name based replace)
    var idMap = {}; // keeps track of original => new id mapping (in string form!)

    // get existing entities
    const entityManager = EntityManagers.get(type);
    entityManager.all().forEach(entity => entityMap[entity.getName()] = entity);

    try {
        // disable saving (for faster imports)
        entityManager.setSaveEnabled(false);

        // TODO: import entities
        const file = path.join(directory, type+'.json');
        if(!existsSync(file)) return idMap;

        const entitiesToImport = readJsonFile(file);
        for(const entityToImport of Object.values(entitiesToImport)) {
            if(!(entityToImport instanceof Entity)) throw new Error('Imported object is not an instance of Entity');
            if(entityToImport.getType() != type) throw new Error('Imported entity is of wrong type');

            const originalID = entityToImport.getID();

            // import entity
            var importedEntity = null;
            if(nameBased && entityMap[entityToImport.getName()]) {
                if(overwriteExisting) {
                    const oldEntity = entityMap[entityToImport.getName()];
                    entityToImport.transferIDFrom(oldEntity);
                    modifier(originalID, entityToImport);
                    entityManager.add(entityToImport);
                    importedEntity = entityToImport;
                } else {
                    importedEntity = entityMap[entityToImport.getName()];
                }
            } else {
                entityToImport.resetID();
                modifier(originalID, entityToImport);
                entityManager.add(entityToImport);
                importedEntity = entityToImport;
            }

            // store name and id mapping
            entityMap[importedEntity.getName()] = importedEntity;
            const newID = importedEntity.getID();
            idMap[String(originalID)] = String(newID);
        }
    } finally {
        // reenable saving (causes automatic save)
        entityManager.setSaveEnabled(true);
    }

    return idMap;
}

export function importData(directory, overwriteExisting) {
    // import files
    console.log('Importing files...')
    fs.copySync(path.join(directory, '/files/'), path.join(path.resolve(), '/data/files/'));

    // import attachments
    const attachmentIDMap = importEntities(directory, overwriteExisting, true, 'attachment', (originalID, attachment) => {});

    // import actors
    importEntities(directory, overwriteExisting, true, 'actor', (originalID, actor) => {
        // adjust attachments
        var attachmentIDs = actor.prop('attachments').getLongList();
        for(var i=0; i<attachmentIDs.length; i++) attachmentIDs[i] = Number(attachmentIDMap[String(attachmentIDs[i])]);
        actor.prop('attachments').setLongList(attachmentIDs);

        // adjust token
        const token = actor.prop('token').getEntity();
        if(token) {
            token.prop('actorID').setLong(actor.getID());
            actor.prop('token').setEntity(token);
        }
    });

    console.log('Import done');
}
