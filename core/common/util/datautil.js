// funtion for registering types NEEDS to be called for every type/class transmitted/stored as json
const nameToTypeMap = new Map();
export function registerType(type) {
    const object = new type();

    nameToTypeMap.set(object.constructor.name, type);
}

// automatically store 'type' of registered types as object property
// also calls preSave on any object where it is present
function storeType(object) {
    if(object && typeof(object) === 'object') {
        storeTypeRecursion(object);
    }
}
function storeTypeRecursion(object) {
    if(Array.isArray(object)) {
        for(var i=0; i<object.length; i++) {
            storeType(object[i]);
        }
    } else {
        for(const key in object) {
            if(object.hasOwnProperty(key) && !key.startsWith('_transient_')) {
                storeType(object[key]);
            }
        }

        if(object.constructor.name !== 'Object') {
            object.__type = object.constructor.name;
        }

        if(typeof(object.preSave) === 'function') {
            object.preSave();
        }
    }
}

// automatically assign stored 'type' from object property
// also calls postLoad on any object where it is present
function assignType(object) {
    if(object && typeof(object) === 'object') {
        object = assignTypeRecursion(object);
    }
    return object;
}
function assignTypeRecursion(object) {
    if(Array.isArray(object)) {
        for(var i=0; i<object.length; i++) {
            object[i] = assignType(object[i]);
        }
    } else {
        for(const key in object) {
            if(object.hasOwnProperty(key)) {
                object[key] = assignType(object[key]);
            }
        }

        if(nameToTypeMap.has(object.__type)) {
            var base = new (nameToTypeMap.get(object.__type))();
            object = Object.assign(base, object);
        }

        if(typeof(object.postLoad) === 'function') {
            object.postLoad();
        }
    }

    return object;
}

// json functions with automatic type assignment and calling preSave/postLoad
function jsonReplacer(key, value) {
    if(key.startsWith('_transient_')) return undefined;
    else return value;
}
function jsonReplacerTransfer(key, value) {
    if(key.startsWith('_transient_')) return undefined;
    if(key.startsWith('_notransfer_')) return undefined;
    else return value;
}

export function toJson(object, forTransfer, pretty = false) {
    storeType(object);
    if(forTransfer) return JSON.stringify(object, jsonReplacerTransfer, pretty ? 4 : null);
    else return JSON.stringify(object, jsonReplacer, pretty ? 4 : null);
}

export function fromJson(text) {
    var object = JSON.parse(text);
    return assignType(object);
}

export function toFormatedSize(value) {
    value = value || 0;
    var suffix = 'B';
    if(value > 1024) { value = value / 1024; suffix = 'KiB'; }
    if(value > 1024) { value = value / 1024; suffix = 'MiB'; }
    if(value > 1024) { value = value / 1024; suffix = 'GiB'; }
    return new Number(value).toFixed(2) + ' ' + suffix;
}

// FileType related
export class FileType {
    #name;
    #allowsUpload;

    constructor(name, allowsUpload) {
        this.#name = name;
        this.#allowsUpload = allowsUpload;
    }

    getName() {
        return this.#name;
    }

    allowsUpload() {
        return this.#allowsUpload;
    }
}

const knownFileEndings = {};
export function registerFileEnding(ending, type) {
    if(!(type instanceof FileType)) throw new Error('Provided Object is not a FileType.');
    knownFileEndings[ending.toLowerCase()] = type;
}
export function getFileType(filePath) {
    const hasFileEnding = filePath.includes('.');
    if(hasFileEnding) {
        const fileEnding = filePath.substring(filePath.lastIndexOf('.')+1).toLowerCase();
        if(knownFileEndings[fileEnding])  {
            return knownFileEndings[fileEnding];
        }
    }
    return FILE_TYPE_UNKNOWN;
}

export const FILE_TYPE_UNKNOWN = new FileType('unknown', false);

export const FILE_TYPE_IMAGE = new FileType('image', true);
registerFileEnding('png', FILE_TYPE_IMAGE);
registerFileEnding('jpg', FILE_TYPE_IMAGE);
registerFileEnding('jpeg', FILE_TYPE_IMAGE);

export const FILE_TYPE_AUDIO = new FileType('audio', true);
registerFileEnding('ogg', FILE_TYPE_AUDIO);
registerFileEnding('mp3', FILE_TYPE_AUDIO);

