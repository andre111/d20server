import path from 'path';
import fs from 'fs-extra';

import { PARAMETERS } from '../parameters.js';
import { fromJson, toJson } from '../../common/util/datautil.js';

// store functions
export function readJson(name) {
    return readJsonFile(nameToPath(name, '.json'));
}
export function readJsonFile(file) {
    if(fs.existsSync(file)) {
        const text = fs.readFileSync(file, 'utf-8');
        return fromJson(text);
    } else {
        return null;
    }
}

export function saveJson(name, object, pretty = false) {
    saveJsonFile(nameToPath(name, '.json'), object, pretty);
}
export function saveJsonFile(file, object, pretty = false) {
    const dir = path.dirname(file);
    if(!fs.existsSync(dir)) fs.mkdirsSync(dir);

    const text = toJson(object, false, pretty);
    fs.writeFileSync(file, text);
}
export async function saveJsonAsync(name, object, pretty = false) {
    const text = toJson(object, false, pretty);
    await fs.writeFile(nameToPath(name, '.json'), text);
}

export function backupJson(name) {
    if(fs.existsSync(nameToPath(name, '.json'))) {
        fs.copyFileSync(nameToPath(name, '.json'), nameToPath(name, '.json.bck'));
    }
}
export async function backupJsonAsync(name) {
    if(fs.existsSync(nameToPath(name, '.json'))) {
        await fs.copyFile(nameToPath(name, '.json'), nameToPath(name, '.json.bck'));
    }
}

function nameToPath(name, ending) {
    if(name.includes('\\') || name.includes('/')) throw new Error("Name cannot contain slashes.");

    name = name.replace('.', '/');
    name = name + ending;

    return path.join(path.resolve(), '/'+PARAMETERS.datadir+'/'+name);
}
