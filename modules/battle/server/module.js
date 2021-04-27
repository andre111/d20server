import { ServerBattleManager } from './server-battle-manager.js';

import { Events } from '../../../core/common/events.js';
import { Commands } from '../../../core/server/command/commands.js';
import { BattleCommand } from './command/battle-command.js';
import { EntityManagers } from '../../../core/common/entity/entity-managers.js';

Events.on('serverInit', event => {
    // listen to any token changes (including deletion) and update battle state
    EntityManagers.get('token').addEntityListener(e => {
        const map = EntityManagers.get('map').find(e.getLong('map'));
        ServerBattleManager.updateState(map);
    });
    EntityManagers.get('token').addRemovalListener((id, e) => {
        const map = EntityManagers.get('map').find(e.getLong('map'));
        ServerBattleManager.updateState(map);
    });

    // register battle command
    Commands.register(new BattleCommand('battle', []));
});
