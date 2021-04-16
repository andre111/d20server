import { Settings } from './settings.js';

export class SettingsEntry {
    #displayName;
    #defaultValue;
    #value;
    #listeners;

    constructor(displayName, defaultValue) {
        this.#displayName = displayName;
        this.#defaultValue = defaultValue;
        this.#value = defaultValue;
        this.#listeners = [];
    }

    get displayName() {
        return this.#displayName;
    }

    get value() {
        return this.#value;
    }
    set value(value) {
        this.#value = value;
        Settings.save();
        for(const listener of this.#listeners) {
            listener();
        }
    }

    get stored() {
        return true;
    }

    addListener(listener) {
        this.#listeners.push(listener);
    }

    resetValue() {
        this.value = this.#defaultValue;
    }

    createName() {
        const nameP = document.createElement('p');
        nameP.innerText = this.#displayName;
        return nameP;
    }

    createEditor() { throw new Error('Cannot call abstract function'); }
}
