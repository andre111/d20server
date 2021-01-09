import { State } from "./state.js";
import { Client } from '../app.js';
import { ServerData } from '../server-data.js';
import { GuiUtils } from '../util/guiutil.js';
import { MessageService } from '../service/message-service.js';

import { RequestAccounts, SignIn } from '../../common/messages.js';

export class StateSignIn extends State {
    playerList;
    accessKeyField;
    observer;

    constructor() {
        super();
    }

    init() {
        // create signin div
        const div = document.createElement('div');
        div.id = 'signin';
        div.className = 'full-overlay fancy-bg';
        document.body.appendChild(div);

        // create signin elements
        const fieldset = GuiUtils.createBorderedSet('Login', '400px', 'auto');
        div.appendChild(fieldset);

        this.playerList = document.createElement('select');
        this.playerList.id = 'signin-playerlist';
        this.playerList.className = 'login-field';
        fieldset.appendChild(this.playerList);
        const labelElement = document.createElement('label');
        labelElement.htmlFor = 'signin-playerlist';
        labelElement.innerHTML = 'Player';
        fieldset.appendChild(labelElement);
        fieldset.appendChild(document.createElement('br'));
        
        this.accessKeyField = GuiUtils.createInput(fieldset, 'password', 'Access-Key');
        this.accessKeyField.className = 'login-field';
        fieldset.appendChild(document.createElement('br'));
        
        const b = document.createElement('button');
        b.innerHTML = 'Sign In';
        b.className = 'login-field';
        b.onclick = () => this.doSignIn();
        fieldset.appendChild(b);

        // add player list observer
        this.observer = () => this.onPlayerList();
        ServerData.profiles.addObserver(this.observer);
        
        // send player list request
        const msg = new RequestAccounts();
        MessageService.send(msg);
    }

    exit() {
        ServerData.profiles.removeObserver(this.observer);

        const div = document.getElementById('signin');
        div.parentElement.removeChild(div);
    }

    onPlayerList() {
        this.playerList.innerHTML = '';
        for(const [key, profile] of ServerData.profiles.get().entries()) {
            const opt = document.createElement('option');
            opt.innerHTML = profile.getUsername();
            if(profile.isConnected()) opt.disabled = true;
            this.playerList.appendChild(opt);
        }
    }

    doSignIn() {
        const msg = new SignIn(Client.VERSION, this.playerList.value, this.accessKeyField.value);
        MessageService.send(msg);
    }
}
