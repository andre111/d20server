import nedb from 'nedb';
import fs from 'fs-extra';
import { fromJson, toJson } from '../core/common/util/datautil.js';
import { readJson } from '../core/server/util/fileutil.js';

function convert(type) {
    const exists = fs.existsSync('./data/entity/'+type+'.db');
    const db = new nedb({ filename: './data/entity/'+type+'.db', autoload: true });

    // import from old format if the new one did not exist
    if(!exists) {
        console.log('Importing from old storage');
        var entities = readJson('entity.'+type);
        if(!entities) entities = {};
        for(const [id, entity] of Object.entries(entities)) {
            const stored = {
                _id: id,
                json: toJson(entity, false, false)
            };

            db.update({ _id: id }, stored, { upsert: true }, (err) => {
                if(err) console.log(err);
            });
        }
    }

    // convert format (properties stored directly in entity)
    console.log('Converting to directly stored properties');
    db.find({}, (err, docs) => {
        for(const doc of docs) {
            const entity = fromJson(doc.json);
            for(const [name, property] of Object.entries(entity.properties)) {
                if(property.type) entity.properties[name] = property.value;
            }
            doc.json = toJson(entity, false, false);

            db.update({ _id: doc._id }, doc, { upsert: true }, err => {}); 
        }

        db.persistence.compactDatafile();
    });
}

convert('actor');
convert('attachment');
convert('drawing');
convert('map');
convert('token');
convert('wall');
