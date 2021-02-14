import { SettingsEntry } from './settings-entry.js';

export class SettingsEntryNumberRange extends SettingsEntry {
    #minValue;
    #maxValue;

    constructor(displayName, defaultValue, minValue, maxValue) {
        super(displayName, defaultValue);

        this.#minValue = minValue;
        this.#maxValue = maxValue;
    }

    createEditor() {
        const editor = document.createElement('input');
        editor.className = 'settings-number-range';
        editor.type = 'range';
        editor.min = this.#minValue;
        editor.max = this.#maxValue;
        editor.value = this.value;

        editor.onchange = () => {
            var value = editor.valueAsNumber;
            if(value < this.#minValue) value = this.#minValue;
            if(value > this.#maxValue) value = this.#maxValue;
            this.value = value;
        }

        return editor;
    }
}
