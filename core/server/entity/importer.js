// @ts-check
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
        const file = path.join(directory, type + '.json');
        if (!existsSync(file)) return idMap;

        const entitiesToImport = readJsonFile(file);
        for (const entityToImport of Object.values(entitiesToImport)) {
            if (!(entityToImport instanceof Entity)) throw new Error('Imported object is not an instance of Entity');
            if (entityToImport.getType() != type) throw new Error('Imported entity is of wrong type');

            const originalID = entityToImport.getID();

            // check for existing entity
            var existingEntity = entityMap[entityToImport.getName()];
            if (!existingEntity && entityToImport.has('path') && entityMap[entityToImport.getString('path') + entityToImport.getName()]) {
                existingEntity = entityMap[entityToImport.getString('path') + entityToImport.getName()];
            }

            // import entity
            var importedEntity = null;
            if (nameBased && existingEntity) {
                if (overwriteExisting) {
                    entityToImport.transferIDFrom(existingEntity);
                    modifier(originalID, entityToImport);
                    entityManager.add(entityToImport);
                    importedEntity = entityToImport;
                } else {
                    importedEntity = existingEntity;
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
    const attachmentIDMap = importEntities(directory, overwriteExisting, true, 'attachment', (originalID, attachment) => { });

    // import actors
    const adjustInternalLinks = (entity, property) => {
        var text = entity.getString(property);
        text = text.replace(/data-target="attachment:\d+"/g, (match) => {
            const oldID = match.substring(24, match.length - 1);
            const newID = String(attachmentIDMap[oldID]);
            return match.replace(oldID, newID);
        });
        entity.setString(property, text);
    };
    importEntities(directory, overwriteExisting, true, 'actor', (originalID, actor) => {
        // adjust attachments
        var attachmentIDs = actor.getLongList('attachments');
        for (var i = 0; i < attachmentIDs.length; i++) attachmentIDs[i] = Number(attachmentIDMap[String(attachmentIDs[i])]);
        actor.setLongList('attachments', attachmentIDs);

        // adjust internal links in bios
        adjustInternalLinks(actor, 'bio');
        adjustInternalLinks(actor, 'gmBio');
    });

    // import compendium
    importEntities(directory, overwriteExisting, true, 'compendium', (originalID, compendium) => { });

    console.log('Import done');
}
