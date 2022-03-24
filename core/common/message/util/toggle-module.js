// @ts-check
import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class ToggleModule extends Message {
    identifier;
    disabled;

    constructor(identifier, disabled) {
        super();
        this.identifier = identifier;
        this.disabled = disabled;
    }

    getIdentifier() {
        return this.identifier;
    }

    getDisabled() {
        return this.disabled;
    }
}
registerType(ToggleModule);
