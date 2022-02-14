import { MapUtils } from '../../../core/client/util/maputil.js';
import { BattleEntry } from './battle-entry.js';

export class BattleList {
    #mainEntries = [];
    #subEntries = [];

    #listEl = null;
    #roundMarker1El = null;
    #roundMarker2El = null;

    constructor() {
        this.#listEl = document.createElement('ul');

        this.#roundMarker1El = document.createElement('li');
        this.#roundMarker1El.className = 'battle-round-marker';
        this.#listEl.appendChild(this.#roundMarker1El);
        this.#roundMarker2El = document.createElement('li');
        this.#roundMarker2El.className = 'battle-round-marker';
        this.#roundMarker2El.style.opacity = 0.75;
        this.#listEl.appendChild(this.#roundMarker2El);
    }

    reload(tokenIDs) {
        // add entries if not enough exist already
        while (this.#mainEntries.length < tokenIDs.length) {
            const mainEntry = new BattleEntry(1);
            this.#mainEntries.push(mainEntry);
            this.#listEl.insertBefore(mainEntry.getContainer(), this.#roundMarker1El);

            const subEntry = new BattleEntry(0.75);
            this.#subEntries.push(subEntry);
            this.#listEl.insertBefore(subEntry.getContainer(), this.#roundMarker2El);
        }

        // (re)load values
        var first = true;
        for (var i = 0; i < this.#mainEntries.length; i++) {
            const tokenID = i < tokenIDs.length ? tokenIDs[i] : -1;

            this.#mainEntries[i].reloadValues(tokenID, first, true);
            this.#subEntries[i].reloadValues(tokenID, false, false);

            // find first token that has not ended its turn
            const token = MapUtils.currentEntities('token').find(t => t.getID() == tokenID);
            if (token && !token.getBoolean('battle_turnEnded')) {
                first = false;
            }
        }
    }

    getElement() {
        return this.#listEl;
    }
}
