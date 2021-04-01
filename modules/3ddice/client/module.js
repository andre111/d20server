import { DiceRoller } from './dice-roller.js';

import { Client } from '../../../core/client/app.js';
import { StateMain } from '../../../core/client/state/state-main.js';

import { Events } from '../../../core/common/events.js';
import { SettingsEntryToggle } from '../../../core/client/settings/settings-entry-toggle.js';
import { SettingsEntryNumberRange } from '../../../core/client/settings/settings-entry-number-range.js';
import { Settings } from '../../../core/client/settings/settings.js';

var diceRoller = null;

Events.on('createMainHTML', event => {
    diceRoller = new DiceRoller();
});

Events.on('chatMessage', event => {
    if(!SETTING_3DDICE_ENABLE.value) return;
    
    // catch chat entries with rolls and that are not in the past
    if(!event.data.entry.getRolls()) return;
    if(event.data.entry.getRolls().length == 0) return;
    if(event.data.historical) return;
    
    // cancel the event to avoid showing the result instantly
    event.cancel();
    
    // throw dice and only add chat entry once they are done
    const t = [
        {
            dice: event.data.entry.getRolls(),
            done: () => {
                if(Client.getState() instanceof StateMain) {
                    Client.getState().getTab('Chat').add(event.data.entry);
                }
            }
        }
    ];
    diceRoller.addThrows(t, true);
});

Events.on('frameEnd', event => {
    diceRoller.onFrame();
});

export const SETTING_3DDICE_ENABLE = new SettingsEntryToggle('Enabled', true);
export const SETTING_3DDICE_VOLUME = new SettingsEntryNumberRange('Volume', 100, 0, 100);
export const SETTING_PAGE_3DDICE = Settings.createPage('3ddice', '3D Dice');
SETTING_PAGE_3DDICE.addEntry('enable', SETTING_3DDICE_ENABLE);
SETTING_PAGE_3DDICE.addEntry('volume', SETTING_3DDICE_VOLUME);
