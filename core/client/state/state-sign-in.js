import { State } from "./state.js";
import { Client } from '../client.js';
import { ServerData } from '../server-data.js';
import { GuiUtils } from '../util/guiutil.js';
import { MessageService } from '../service/message-service.js';

import { RequestAccounts, SignIn } from '../../common/messages.js';
import { Events } from '../../common/events.js';
import { I18N } from '../../common/util/i18n.js';

export class StateSignIn extends State {
    playerList;
    accessKeyField;
    listener;

    constructor() {
        super();
    }

    init() {
        // create signin div
        const div = document.createElement('div');
        div.id = 'signin';
        div.className = 'full-overlay';
        GuiUtils.makeFancyBG(div);
        document.body.appendChild(div);

        // create signin elements
        const fieldset = GuiUtils.createBorderedSet(I18N.get('state.signin', 'Login'), '400px', 'auto');
        div.appendChild(fieldset);

        this.playerList = document.createElement('select');
        this.playerList.id = 'signin-playerlist';
        this.playerList.className = 'login-field';
        fieldset.appendChild(this.playerList);
        const labelElement = document.createElement('label');
        labelElement.htmlFor = 'signin-playerlist';
        labelElement.innerHTML = I18N.get('state.signin.player', 'Player');
        fieldset.appendChild(labelElement);
        fieldset.appendChild(document.createElement('br'));

        this.accessKeyField = GuiUtils.createInput(fieldset, 'password', I18N.get('state.signin.accesskey', 'Access-Key'));
        this.accessKeyField.className = 'login-field';
        this.accessKeyField.onkeydown = e => { if (e.keyCode == 13) this.doSignIn() };
        fieldset.appendChild(document.createElement('br'));

        const b = document.createElement('button');
        b.innerHTML = I18N.get('state.signin.button', 'Sign In');
        b.className = 'login-field';
        b.onclick = () => this.doSignIn();
        fieldset.appendChild(b);

        // add player list observer
        this.listener = Events.on('profileListChange', event => this.onPlayerList());

        // send player list request
        const msg = new RequestAccounts();
        MessageService.send(msg);
    }

    exit() {
        Events.remove('profileListChange', this.listener);

        const div = document.getElementById('signin');
        div.parentElement.removeChild(div);
    }

    onPlayerList() {
        this.playerList.innerHTML = '';
        for (const [key, profile] of ServerData.profiles.entries()) {
            const opt = document.createElement('option');
            opt.innerHTML = profile.getUsername();
            if (profile.isConnected()) opt.disabled = true;
            this.playerList.appendChild(opt);
        }
    }

    doSignIn() {
        const msg = new SignIn(Client.VERSION, this.playerList.value, this.accessKeyField.value);
        MessageService.send(msg);
    }
}
