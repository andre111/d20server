import { ModeButton } from './mode-button.js';
import { ModeButtonExtended } from './mode-button-extended.js';
import { ServerData } from '../server-data.js';
import { Settings } from '../settings/settings.js';

import { Events } from '../../common/events.js';

export { ModeButton } from './mode-button.js';
export { ModeButtonExtended } from './mode-button-extended.js';
export class ModePanel {
    constructor() {
        // create buttons
        this.buttons = [];
        const data = {
            addButton: button => {
                if (!(button instanceof ModeButtonExtended)) throw new Error('Invalid parameters, can only add ModeButtonExtended objects!');
                this.buttons.push(button);
            }
        };
        Events.trigger('addModeButtons', data);
        if (ServerData.isGM()) {
            Events.trigger('addModeButtonsGM', data);
        }

        // settings
        this.buttons.push(new ModeButtonExtended(new ModeButton('/core/files/img/gui/settings', 'Open Settings', () => false, () => Settings.openWindow()), 8));

        // init html elements
        this.container = document.createElement('div');
        this.container.className = 'mode-panel';
        document.body.appendChild(this.container);
        for (const button of this.buttons) {
            this.container.appendChild(button.container);
        }
        this.updateState();

        // add callback
        Events.on('mapChange', event => this.updateState());
        Events.on('updateModeState', event => this.updateState());
    }

    updateState() {
        // update buttons
        for (const button of this.buttons) {
            button.updateState();
        }
    }
}
