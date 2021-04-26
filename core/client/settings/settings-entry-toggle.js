import { SettingsEntry } from './settings-entry.js';

export class SettingsEntryToggle extends SettingsEntry {
    constructor(i18nKey, displayName, defaultValue) {
        super(i18nKey, displayName, defaultValue);
    }

    createEditor() {
        const editor = document.createElement('input');
        editor.className = 'settings-toggle';
        editor.type = 'checkbox';
        editor.checked = this.value;

        editor.onchange = () => {
            this.value = editor.checked;
        }

        return editor;
    }
}
