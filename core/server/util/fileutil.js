import path from 'path';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs';

import { fromJson, toJson } from '../../common/util/datautil.js';

// store functions
export function readJson(name) {
    if(existsSync(nameToPath(name, '.json'))) {
        const text = readFileSync(nameToPath(name, '.json'), 'utf-8');
        return fromJson(text);
    } else {
        return null;
    }
}

export function saveJson(name, object) {
    const text = toJson(object);
    writeFileSync(nameToPath(name, '.json'), text, );
}

export function backupJson(name) {
    if(existsSync(nameToPath(name, '.json'))) {
        copyFileSync(nameToPath(name, '.json'), nameToPath(name, '.json.bck'));
    }
}

function nameToPath(name, ending) {
    if(name.includes('\\') || name.includes('/')) throw new Error("Name cannot contain slashes.");

    name = name.replace('.', '/');
    name = name + ending;

    return path.join(path.resolve(), '/data/'+name);
}
