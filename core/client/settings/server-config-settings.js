// @ts-check
import { CONFIG } from '../../common/config.js';
import { Type } from '../../common/constants.js';
import { Events } from '../../common/events.js';
import { ChangeConfig } from '../../common/messages.js';
import { MessageService } from '../service/message-service.js';
import { SettingsEntryToggle } from './settings-entry-toggle.js';
import { Settings } from './settings.js';

export class ServerConfigSettings {
    static #PAGE;
    static #ENTRIES;

    static init() {
        ServerConfigSettings.#PAGE = Settings.createPage('server', 'Server');
        ServerConfigSettings.#ENTRIES = {};

        CONFIG.iterate((key, def, value) => {
            if (def.clientAccessible) {
                var entry = null;
                switch (def.type) {
                    case Type.BOOLEAN:
                        entry = new SettingsEntryToggle('settings.config.' + key, key, value);
                        break;
                    case Type.STRING:
                        //TODO: implement (for motd) - and later how do I special case language?
                        break;
                    default:
                        console.log('WARNING: Cannot create config entry of type: ' + def.type);
                        break;
                }

                if (entry) {
                    entry.addListener(() => MessageService.send(new ChangeConfig(key, entry.value)));
                    ServerConfigSettings.#PAGE.addEntry(key, entry);
                }
            }
        });

        Events.on('configValueChange', event => {
            const entry = ServerConfigSettings.#ENTRIES[event.data.key];
            if (entry) {
                entry.changeValueNoNotify(event.data.value);
            }
        });
    }
}
