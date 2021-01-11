import { DiceRoller } from './dice-roller.js';

import { Client } from '../../../core/client/app.js';
import { StateMain } from '../../../core/client/state/state-main.js';

import { Events } from '../../../core/common/events.js';

var diceRoller = null;

Events.on('createMainHTML', state => {
    diceRoller = new DiceRoller();
});

Events.on('chatMessage', evt => {
    if(evt.canceled) return;
    
    // catch chat entries with rolls and that are not in the past
    if(!evt.entry.getRolls()) return;
    if(evt.entry.getRolls().length == 0) return;
    if(evt.historical) return;
    
    // cancel the event to avoid showing the result instantly
    evt.canceled = true;
    
    // throw dice and only add chat entry once they are done
    var t = [
        {
            dice: evt.entry.getRolls(),
            done: () => {
                if(Client.getState() instanceof StateMain) {
                    Client.getState().getTab('Chat').add(evt.entry);
                }
            }
        }
    ];
    diceRoller.addThrows(t, true);
});

Events.on('frameEnd', () => {
    diceRoller.onFrame();
});
