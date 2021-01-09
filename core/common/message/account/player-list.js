import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class PlayerList extends Message {
    players;

    constructor(players) {
        super();
        this.players = players;
    }

    getPlayers() {
        return this.players;
    }
}
registerType(PlayerList);
