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

function moveMacros() {
    console.log('Moving macros to actors');
    const tokenDB = new nedb({ filename: './data/entity/token.db', autoload: true });
    const actorDB = new nedb({ filename: './data/entity/actor.db', autoload: true });
    const newestTokenPerActor = new Map();
    // for every token
    tokenDB.find({}, (err, docs) => {
        for(const doc of docs) {
            const token = fromJson(doc.json);
            const tokenID = Number(doc._id);
            const tokenMacros = getStringMap(token.properties['macros']);
            const actorID = Number(token.properties['actorID']);

            // check that this token is the newest for this actor
            const isNewest = !newestTokenPerActor.has(actorID) || newestTokenPerActor.get(actorID) < tokenID;

            // find actor
            if(tokenMacros != {} && actorID > 0 && isNewest) {
                newestTokenPerActor.set(actorID, tokenID);

                actorDB.find({ _id: String(actorID) }, (err, adocs) => {
                    if(adocs.length == 0) {
                        console.log(`Actor ${actorID} not found`);
                        return;
                    }

                    const actor = fromJson(adocs[0].json);
                    // move and update macros
                    const macros = getStringMap(actor.properties['macros']);
                    for(const [name, value] of Object.entries(tokenMacros)) {
                        macros[name] = value.replace('selected.property.mod', 'selected.actor.property.mod');
                    }
                    actor.properties['macros'] = setStringMap(macros);
                    // save modified actor
                    adocs[0].json = toJson(actor, false, false);
                    actorDB.update({ _id: adocs[0]._id }, adocs[0], { upsert: true }, err => {}); 
                });
            }
        }

        actorDB.persistence.compactDatafile();
    });
}

function getStringMap(value) {
    if(!value || value == '') return {};

    var map = {};
    var split = value.split('§');
    for(var i=0; i<split.length-1; i+=2) {
        map[split[i]] = split[i+1];
    }
    return map;
}
function setStringMap(value) {
    var string = '';
    for(const [key, entry] of Object.entries(value)) {
        string = string + key.replace('§', '') + '§' + entry.replace('§', '') + '§';
    }
    return string;
}

/*
convert('actor');
convert('attachment');
convert('drawing');
convert('map');
convert('token');
convert('wall');
//*/

//TODO: never call this directly with convert, as these functions DO NOT block until done but return instantly -> conflicts!
moveMacros();
