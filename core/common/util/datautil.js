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
    for(const key in object) {
        if(object.hasOwnProperty(key) && !key.startsWith('_transient_')) {
            var obj = object[key];
            if(Array.isArray(obj)) {
                for(var i=0; i<obj.length; i++) {
                    storeType(obj[i]);
                }
            } else {
                storeType(obj);
            }
        }
    }

    if(object.constructor.name !== 'Object') {
        object.__type = object.constructor.name;
    }

    if(typeof(object.preSave) === 'function') {
        object.preSave();
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
    for(const key in object) {
        if(object.hasOwnProperty(key) && !key.startsWith('_transient_')) {
            var obj = object[key];
            if(Array.isArray(obj)) {
                for(var i=0; i<obj.length; i++) {
                    obj[i] = assignType(obj[i]);
                }
            } else {
                object[key] = assignType(obj);
            }
        }
    }

    var base = {};
    if(nameToTypeMap.has(object.__type)) {
        base = new (nameToTypeMap.get(object.__type))();
    }
    object = Object.assign(base, object);

    if(typeof(object.postLoad) === 'function') {
        object.postLoad();
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

export function toJson(object, forTransfer) {
    storeType(object);
    if(forTransfer) return JSON.stringify(object, jsonReplacerTransfer);
    else return JSON.stringify(object, jsonReplacer);
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
