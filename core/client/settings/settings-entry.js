import { I18N } from '../../common/util/i18n.js';
import { Settings } from './settings.js';

export class SettingsEntry {
    #i18nKey;
    #displayName;
    #defaultValue;
    #value;
    #listeners;

    constructor(i18nKey, displayName, defaultValue) {
        this.#i18nKey = i18nKey;
        this.#displayName = displayName;
        this.#defaultValue = defaultValue;
        this.#value = defaultValue;
        this.#listeners = [];
    }

    get i18nKey() {
        return this.i18nKey;
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
        console.log('reset '+this.#displayName);
        this.value = this.#defaultValue;
    }

    changeValueNoNotify(value) {
        this.#value = value;
    }

    createName() {
        const nameP = document.createElement('p');
        nameP.innerText = I18N.get(this.#i18nKey, this.#displayName);
        return nameP;
    }

    createEditor() { throw new Error('Cannot call abstract function'); }
}
