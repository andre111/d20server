import { Client } from '../../../core/client/app.js';
import { TokenRenderer } from '../../../core/client/renderer/token-renderer.js';
import { ServerData } from '../../../core/client/server-data.js';
import { EntityManagers } from '../../../core/common/entity/entity-managers.js';

export class BattleEntry {
    #tokenID;

    #containerEl;
    #imageEl;
    #iniEl;
    #iniSubEl;
    #nameEl;

    #barFillers;

    constructor(tokenID, active) {
        this.#tokenID = tokenID;

        // create html elements
        this.#containerEl = document.createElement('li');
        this.#containerEl.className = active ? 'battle-entry-active' : 'battle-entry';

        this.#imageEl = document.createElement('img');
        this.#containerEl.appendChild(this.#imageEl);
        
        const iniContainer = document.createElement('div');
        iniContainer.className = 'battle-entry-ini';
        this.#iniEl = document.createElement('span');
        iniContainer.appendChild(this.#iniEl);
        this.#iniSubEl = document.createElement('span');
        iniContainer.appendChild(this.#iniSubEl);
        this.#containerEl.appendChild(iniContainer);

        // bars
        this.#barFillers = [];
        for(var i=1; i<=3; i++) {
            const bar = document.createElement('div');
            bar.className = 'battle-entry-bar';
            const barFiller = document.createElement('div');
            barFiller.style.backgroundColor = TokenRenderer.BAR_COLORS[i-1];
            this.#barFillers.push(barFiller);
            bar.appendChild(barFiller);
            this.#containerEl.appendChild(bar);
        }

        // name
        this.#nameEl = document.createElement('span');
        this.#nameEl.className = 'battle-entry-name';
        this.#containerEl.appendChild(this.#nameEl);

        
        // add hover functionality
        this.#containerEl.onmouseover = () => Client.getState().setHighlightToken(tokenID);
        this.#containerEl.onmouseout = () => Client.getState().releaseHighlightToken(tokenID);

        // load initial values
        this.reloadValues();
    }

    setActive(active) {
        this.#containerEl.className = active ? 'battle-entry-active' : 'battle-entry';
    }

    reloadValues() {
        // find token
        const token = EntityManagers.get('token').find(this.#tokenID);
        if(!token) {
            this.#containerEl.style.visibility = 'none';
            console.log('Token for BattleEntry not found!');
            return;
        }
        // get access level
        const accessLevel = token.getAccessLevel(ServerData.localProfile);

        // (re)load values
        this.#containerEl.style.visibility = 'visible';

        this.#imageEl.src = '/data/files/'+token.prop('imagePath').getString();

        const ini = token.prop('battle_initiative').getDouble();
        this.#iniEl.innerText = ini.toFixed(0);
        this.#iniSubEl.innerText = (ini % 1).toFixed(2).substring(1);

        // bars
        for(var i=1; i<=3; i++) {
            if(TokenRenderer.isBarVisible(token, ServerData.localProfile, i)) {
                const current = token.prop('bar'+i+'Current').getLong();
                const max = token.prop('bar'+i+'Max').getLong();
                const percentage = Math.max(0, Math.min(current, max)) / max * 100;

                this.#barFillers[i-1].style.visibility = 'visible';
                this.#barFillers[i-1].style.width = `${percentage}%`;
            } else {
                this.#barFillers[i-1].style.visibility = 'hidden';
            }
        }

        // name
        if(token.prop('name').canView(accessLevel)) {
            this.#nameEl.innerText = token.prop('name').getString();
        } else {
            this.#nameEl.innerText = '???';
        }
    }

    getContainer() {
        return this.#containerEl;
    }
}
