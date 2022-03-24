// @ts-check
import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class Ping extends Message {
    time;

    constructor(time) {
        super();
        this.time = time;
    }

    getTime() {
        return this.time;
    }
}
registerType(Ping);
