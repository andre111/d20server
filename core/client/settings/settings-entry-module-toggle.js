// @ts-check
import { ToggleModule } from '../../common/messages.js';
import { MessageService } from '../service/message-service.js';
import { SettingsEntry } from './settings-entry.js';

export class SettingsEntryModuleToggle extends SettingsEntry {
    #identifier;
    #name;
    #version;
    #description;

    #updating;
    #editor;

    constructor(identifier, name, version, description) {
        super(name, name, true);

        this.#identifier = identifier;
        this.#name = name;
        this.#version = version;
        this.#description = description;
    }

    get stored() {
        return false;
    }

    update(disabled) {
        this.value = !disabled;

        if (this.#editor) {
            this.#updating = true;
            this.#editor.checked = !disabled;
            this.#updating = false;
        }
    }

    createName() {
        const div = document.createElement('div');

        const nameP = document.createElement('p');
        nameP.className = 'settings-module-name';
        nameP.innerText = this.#name + ' - ' + this.#version;
        div.appendChild(nameP);

        const descP = document.createElement('p');
        descP.className = 'settings-module-description';
        descP.innerText = this.#description;
        div.appendChild(descP);

        return div;
    }

    createEditor() {
        this.#editor = document.createElement('input');
        this.#editor.className = 'settings-toggle';
        this.#editor.type = 'checkbox';
        this.#editor.checked = this.value;

        this.#editor.onchange = () => {
            this.value = this.#editor.checked;

            // notify server
            if (!this.#updating) {
                MessageService.send(new ToggleModule(this.#identifier, !this.value));
            }
        }

        return this.#editor;
    }
}
