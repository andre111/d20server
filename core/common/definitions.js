import { registerType } from './util/datautil.js';

var _definitions = null;

export function getDefinitions() {
    return _definitions;
}

export function setDefinitions(definitions) {
    _definitions = definitions;
}

export class Definitions {
    entityDefinitions = {};

    constructor() {
    }

    addEntityDefinition(type, entityDefinition) {
        this.entityDefinitions[type] = entityDefinition;
    }

    getEntityDefinition(type) {
        return this.entityDefinitions[type];
    }

    getEntityDefinitions() {
        return this.entityDefinitions;
    }
}
registerType(Definitions);
