import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class SelectedTokens extends Message {
    selectedTokens;

    constructor(selectedTokens) {
        super();
        this.selectedTokens = selectedTokens;
    }

    getSelectedTokens() {
        return this.selectedTokens;
    }

    requiresMap() {
        return true;
    }
}
registerType(SelectedTokens);
