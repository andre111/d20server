import { SettingsEntry } from './settings-entry.js';

export class SettingsEntryToggle extends SettingsEntry {
    constructor(displayName, defaultValue) {
        super(displayName, defaultValue);
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
