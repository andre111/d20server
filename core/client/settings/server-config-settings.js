import { ChangeConfig } from '../../common/messages.js';
import { CONFIG } from '../config.js';
import { MessageService } from '../service/message-service.js';
import { SettingsEntryToggle } from './settings-entry-toggle.js';
import { Settings } from './settings.js';

export class ServerConfigSettings {
    static #PAGE;
    static #CONFIG_DEFINITION;

    //TODO: remove hardcoded config editors in favor of server transmitted config definitions
    static #gmLockout;
    static #motd;

    static init() {
        ServerConfigSettings.#PAGE = Settings.createPage('server', 'Server');
        ServerConfigSettings.#CONFIG_DEFINITION = {};

        ServerConfigSettings.#gmLockout = new SettingsEntryToggle('settings.config.gmLockout', 'GM Lockout', CONFIG.get().gmLockout ?? false);
        ServerConfigSettings.#gmLockout.addListener(() => MessageService.send(new ChangeConfig('gmLockout', ServerConfigSettings.#gmLockout.value)));
        ServerConfigSettings.#PAGE.addEntry('gmLockout', ServerConfigSettings.#gmLockout);

        //TODO: motd
    }

    static onConfigDefinitions(configDefinitions) {
        if(ServerConfigSettings.#PAGE) {
            //TODO: implement
        }
    }

    static onConfigChange(key, value) {
        if(ServerConfigSettings.#PAGE) {
            if(key == 'gmLockout') {
                ServerConfigSettings.#gmLockout.changeValueNoNotify(value);
            }
        }
    }
}
