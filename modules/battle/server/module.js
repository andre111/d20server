import { ServerBattleManager } from './server-battle-manager.js';

import { Events } from '../../../core/common/events.js';
import { Commands } from '../../../core/server/command/commands.js';
import { BattleCommand } from './command/battle-command.js';

Events.on('serverInit', event => {
    // listen to any token changes (including deletion) and update battle state
    Events.on('any_token', event => {
        const map = event.data.manager.parentEntity;
        ServerBattleManager.updateState(map);
    });

    // register battle command
    Commands.register(new BattleCommand('battle', []));
});
