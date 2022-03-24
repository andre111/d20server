// @ts-check
import { SettingsEntryModuleToggle } from './settings-entry-module-toggle.js';
import { Settings } from './settings.js';

export class ModuleSettings {
    static #PAGE;
    static #MODULE_ENTRIES;

    static init() {
        ModuleSettings.#PAGE = Settings.createPage('modules', 'Modules');
        ModuleSettings.#MODULE_ENTRIES = {};
    }

    static onModuleDefinitions(moduleDefinitions, disabledModules) {
        if (ModuleSettings.#PAGE) {
            for (const [identifier, definition] of Object.entries(moduleDefinitions)) {
                if (!ModuleSettings.#MODULE_ENTRIES[identifier]) {
                    ModuleSettings.#MODULE_ENTRIES[identifier] = new SettingsEntryModuleToggle(identifier, definition.name, definition.version, definition.description);
                    ModuleSettings.#PAGE.addEntry(identifier, ModuleSettings.#MODULE_ENTRIES[identifier]);
                }

                ModuleSettings.#MODULE_ENTRIES[identifier].update(disabledModules.includes(identifier));
            }
        }
    }
}
