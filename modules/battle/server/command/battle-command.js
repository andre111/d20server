import { Access, Role } from '../../../../core/common/constants.js';
import { EntityManagers } from '../../../../core/common/entity/entity-managers.js';
import { EntityReference } from '../../../../core/common/entity/entity-reference.js';
import { I18N } from '../../../../core/common/util/i18n.js';
import { Command } from '../../../../core/server/command/command.js';
import { CommonBattleManager } from '../../common/common-battle-manager.js';
import { ServerBattleManager } from '../server-battle-manager.js';

class BattleAction {
    name;
    requiresGM;
    requiresToken;
    callback;

    constructor(name, requiresGM, requiresToken, callback) {
        this.name = name;
        this.requiresGM = requiresGM;
        this.requiresToken = requiresToken;
        this.callback = callback;
    }
}
const ACTIONS = [
    // GM Actions
    new BattleAction('start', true, false, (profile, map, token, args) => {
        ServerBattleManager.startBattle(map);
    }),
    new BattleAction('end', true, false, (profile, map, token, args) => {
        ServerBattleManager.endBattle(map);
    }),
    new BattleAction('nextTurn', true, false, (profile, map, token, args) => {
        ServerBattleManager.nextTurn(map);
    }),

    // Token Actions (can be performed by any controlling player, should setInitiative be done here to and not as a normal property access?)
    new BattleAction('join', false, true, (profile, map, token, args) => {
        if (!CommonBattleManager.isBattleActive(map)) return;

        const accessLevel = token.getAccessLevel(profile);
        if (Access.matches(Access.CONTROLLING_PLAYER, accessLevel)) {
            const tokenRef = new EntityReference(token);
            tokenRef.setBoolean('battle_active', true);
            if (CommonBattleManager.getBattleRound(map) == 0) {
                tokenRef.setBoolean('battle_turnStarted', true);
                tokenRef.setBoolean('battle_turnEnded', true);
            }
            tokenRef.performUpdate();
        }
    }),
    new BattleAction('leave', false, true, (profile, map, token, args) => {
        if (!CommonBattleManager.isBattleActive(map)) return;

        const accessLevel = token.getAccessLevel(profile);
        if (Access.matches(Access.CONTROLLING_PLAYER, accessLevel)) {
            const tokenRef = new EntityReference(token);
            tokenRef.setBoolean('battle_active', false);
            tokenRef.performUpdate();
        }
    })
];

export class BattleCommand extends Command {
    constructor(name, aliases) {
        super(name, aliases, false);
    }

    execute(profile, args) {
        // validate some input and find required objects
        const argsSplit = args.split(' ');
        if (argsSplit.length < 1) throw new Error(I18N.get('commands.error.arguments', 'Wrong argument count: %0', '<action> ...'));

        const map = EntityManagers.get('map').find(profile.getCurrentMap());
        if (!map) throw new Error(I18N.get('command.battle.error.nomap', 'Battle actions can only be performed on a map'));

        const token = profile.getSelectedToken(true);

        // find action
        for (const action of ACTIONS) {
            if (action.name == argsSplit[0]) {
                // validate action requirements
                if (action.requiresGM && profile.getRole() != Role.GM) throw new Error(I18N.get('commands.error.permission', 'You do not have permission to use this command'));
                if (action.requiresToken && !token) throw new Error(I18N.get('command.battle.error.notoken', 'This action requries a selected token'));

                // perform action
                action.callback(profile, map, token, argsSplit.slice(1));
                return;
            }
        }

        // -> no action found
        throw new Error(I18N.get('command.battle.error.unknown', 'Unknown battle action %0', argsSplit[0]));
    }
}
