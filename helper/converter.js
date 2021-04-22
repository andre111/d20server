import { readJson } from '../core/server/util/fileutil.js';

import nedb from 'nedb';
import { toJson } from '../core/common/util/datautil.js';

function convert(type) {
    var entities = readJson('entity.'+type);
    if(!entities) entities = {};

    var db = new nedb({ filename: './data/entity/'+type+'.db', autoload: true });
    for(const [id, entity] of Object.entries(entities)) {
        const stored = {
            _id: id,
            json: toJson(entity, false, false)
        };

        db.update({ _id: id }, stored, { upsert: true }, (err) => {
            if(err) console.log(err);
        });
    }
    db.persistence.compactDatafile();
}

convert('actor');
convert('attachment');
convert('drawing');
convert('map');
convert('token');
convert('wall');
