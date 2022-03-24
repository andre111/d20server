// @ts-check
import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class SetPlayerColor extends Message {
    color;

    constructor(color) {
        super();
        this.color = color;
    }

    getColor() {
        return this.color;
    }
}
registerType(SetPlayerColor);
