// @ts-check
import { State } from './state.js';
import { StateSignIn } from './state-sign-in.js';
import { StateDisconnected } from './state-disconnected.js';

import { Connection } from '../connection.js';
import { Client } from '../client.js';
import { Settings } from '../settings/settings.js';
import { I18N } from '../../common/util/i18n.js';

export class StateInit extends State {
    constructor() {
        super();
    }

    init() {
        // initialize libraries
        // @ts-ignore
        dayjs.locale('de');
        // @ts-ignore
        dayjs.extend(window.dayjs_plugin_relativeTime);
        // @ts-ignore
        dayjs.extend(window.dayjs_plugin_duration);
        // @ts-ignore
        dayjs.extend(window.dayjs_plugin_localizedFormat);

        // load language file
        fetch('/lang.json').then(res => res.json()).then(data => I18N.mergeObject(data));

        // add global error "handler" for reporting unhandled/uncaught errors
        window.onerror = function (message, source, lineno, colno, error) {
            if (!(Client.getState() instanceof StateDisconnected)) {
                Client.setState(new StateDisconnected(-1, 'Clientside Error', error));
                Connection.close();
            }
        }

        // initialize connection
        document.body.innerHTML = 'Connecting to server...';
        Connection.init(this.onConnect, this.onClose);
    }

    exit() {
    }

    onConnect(e) {
        document.body.innerHTML = '';
        Settings.load();
        Client.setState(new StateSignIn());
    }

    onClose(e) {
        // do NOT go back to StateInit, as old event listeners and other stuff could remain 
        // -> ask for manualy full page reload
        if (!(Client.getState() instanceof StateDisconnected)) {
            Client.setState(new StateDisconnected(e.code, e.reason));
        }
    }
}
