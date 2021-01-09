import { State } from './state.js';
import { StateSignIn } from './state-sign-in.js';
import { StateDisconnected } from './state-disconnected.js';

import { Connection } from '../connection.js';
import { Client } from '../app.js';

export class StateInit extends State {
    constructor() {
        super();
    }

    init() {
        // initialize libraries
        dayjs.locale('de');
        dayjs.extend(window.dayjs_plugin_relativeTime);
        dayjs.extend(window.dayjs_plugin_duration);
        dayjs.extend(window.dayjs_plugin_localizedFormat);

        // initialize connection
        document.body.innerHTML = 'Connecting to server...';
        Connection.init(() => this.onConnect(), () => this.onClose());
    }

    exit() {
    }

    onConnect() {
        document.body.innerHTML = '';
        Client.setState(new StateSignIn());
    }

    onClose() {
        // do NOT go back to StateInit, as old event listeners and other stuff could remain 
        // -> ask for manualy full page reload
        Client.setState(new StateDisconnected());
    }
}
