import nedb from 'nedb';
import * as fs from 'fs-extra';
import { toJson } from '../core/common/util/datautil.js';
import { readJson } from '../core/server/util/fileutil.js';

function convert(type) {
    const exists = fs.existsSync('./data/entity/'+type+'.db');
    const db = new nedb({ filename: './data/entity/'+type+'.db', autoload: true });

    // import from old format if the new one did not exist
    if(!exists) {
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

    //TODO: convert format (properties stored directly in entity)

    db.persistence.compactDatafile();
}

convert('actor');
convert('attachment');
convert('drawing');
convert('map');
convert('token');
convert('wall');
