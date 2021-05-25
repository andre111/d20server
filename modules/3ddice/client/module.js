import { DiceRoller } from './dice-roller.js';
import { SETTING_3DDICE_ENABLE } from './settings.js';

import { Client } from '../../../core/client/client.js';
import { StateMain } from '../../../core/client/state/state-main.js';

import { Events } from '../../../core/common/events.js';

var diceRoller = null;

Events.on('enterMainState', event => {
    diceRoller = new DiceRoller();
});

Events.on('chatMessage', event => {
    if(!SETTING_3DDICE_ENABLE.value) return;
    
    // catch chat entries with rolls and that are not in the past
    if(event.data.historical) return;
    if(!event.data.entry.getRolls()) return;
    if(event.data.entry.getRolls().length == 0) return;
    
    // cancel the event to avoid showing the result instantly
    event.cancel();
    
    // throw dice and only add chat entry once they are done
    const t = [
        {
            dice: event.data.entry.getRolls(),
            done: () => {
                if(Client.getState() instanceof StateMain) {
                    Client.getState().getTab('Chat').add([event.data.entry]);
                }
            }
        }
    ];
    diceRoller.addThrows(t, true);
});

Events.on('frameEnd', event => {
    diceRoller.onFrame();
});
