import { Client } from '../../../core/client/app.js';
import { TokenRenderer } from '../../../core/client/renderer/token-renderer.js';
import { ServerData } from '../../../core/client/server-data.js';
import { EntityManagers } from '../../../core/common/entity/entity-managers.js';

export class BattleEntry {
    #tokenID = -1;
    #state = {};

    #containerEl;
    #imageEl;
    #iniEl;
    #iniSubEl;
    #nameEl;

    #barFillers;

    constructor(opacity) {
        // create html elements
        this.#containerEl = document.createElement('li');
        this.#containerEl.className = 'battle-entry';
        this.#containerEl.style.opacity = opacity;

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
        this.#containerEl.onmouseover = () => Client.getState().setHighlightToken(this.#tokenID);
        this.#containerEl.onmouseout = () => Client.getState().releaseHighlightToken(this.#tokenID);
    }

    changeValue(key, newValue, setter) {
        if(this.#state[key] == newValue) return;
        this.#state[key] = newValue;
        setter(newValue);
    }

    //TODO: optimize this to change as little as possible
    reloadValues(tokenID, active, current) {
        this.#tokenID = tokenID;

        // find token
        const token = EntityManagers.get('token').find(this.#tokenID);
        if(!token) {
            this.changeValue('display', 'none', v => this.#containerEl.style.display = v);
            if(tokenID > 0) console.log('Token for BattleEntry not found!');
            return;
        }
        // get access level
        const accessLevel = token.getAccessLevel(ServerData.localProfile);

        // (re)load values
        this.changeValue('display', current && token.prop('battle_turnEnded').getBoolean() ? 'none' : 'flex', v => this.#containerEl.style.display = v);
        this.changeValue('className', active ? 'battle-entry-active' : 'battle-entry', v => this.#containerEl.className = v);

        this.changeValue('imgSrc', '/data/files/'+token.prop('imagePath').getString(), v => this.#imageEl.src = v);

        const ini = token.prop('battle_initiative').getDouble();
        this.changeValue('initiative', ini.toFixed(0), v => this.#iniEl.innerText = v);
        this.changeValue('initiativeSub', (ini % 1).toFixed(2).substring(1), v => this.#iniSubEl.innerText = v);

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
        var name = '???';
        if(token.prop('name').canView(accessLevel)) {
            name = token.prop('name').getString();
        }
        this.changeValue('name', name, v => this.#nameEl.innerText = v);
    }

    getContainer() {
        return this.#containerEl;
    }
}
