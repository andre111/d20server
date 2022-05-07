// @ts-check
import { SettingsEntry } from './settings-entry.js';

export class SettingsEntrySelect extends SettingsEntry {
    #availableValues;

    constructor(i18nKey, displayName, defaultValue, availableValues) {
        super(i18nKey, displayName, defaultValue);

        this.#availableValues = availableValues;
    }

    createEditor() {
        const editor = document.createElement('select');
        editor.className = 'settings-select';

        for (const value of this.#availableValues) {
            const option = document.createElement('option');
            option.value = value;
            option.innerHTML = value;
            editor.appendChild(option);
        }
        editor.value = this.value;

        editor.onchange = () => {
            this.value = editor.value;
        }

        return editor;
    }
}
