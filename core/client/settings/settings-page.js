import { SettingsEntry } from './settings-entry.js';

export class SettingsPage {
    #displayName;
    #entries;

    constructor(displayName) {
        this.#displayName = displayName;
        this.#entries = {};
    }

    addEntry(internalName, entry) {
        if(this.#entries[internalName]) throw new Error(`Duplicated settings entry name: ${internalName}`);
        if(!(entry instanceof SettingsEntry)) throw new Error('Can only add instances of SettingsEntry');

        this.#entries[internalName] = entry;
    }

    get displayName() {
        return this.#displayName;
    }

    get entries() {
        return Object.values(this.#entries);
    }

    toObject() {
        var obj = {};
        for(const [name, entry] of Object.entries(this.#entries)) {
            if(entry.stored) obj[name] = entry.value;
        }
        return obj;
    }

    fromObject(obj) {
        for(const [name, entry] of Object.entries(this.#entries)) {
            if(entry.stored && obj[name]) entry.value = obj[name];
        }
    }
}
