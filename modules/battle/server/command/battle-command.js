import { Access, Role } from '../../../../core/common/constants.js';
import { EntityManagers } from '../../../../core/common/entity/entity-managers.js';
import { EntityReference } from '../../../../core/common/entity/entity-reference.js';
import { Command } from '../../../../core/server/command/command.js';
import { ChatService } from '../../../../core/server/service/chat-service.js';
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
        if(!CommonBattleManager.isBattleActive(map)) return;
        
        const accessLevel = token.getAccessLevel(profile);
        if(Access.matches(Access.CONTROLLING_PLAYER, accessLevel)) {
            const tokenRef = new EntityReference(token);
            tokenRef.prop('battle_active').setBoolean(true);
            if(CommonBattleManager.getBattleRound(map) == 0) {
                tokenRef.prop('battle_turnStarted').setBoolean(true);
                tokenRef.prop('battle_turnEnded').setBoolean(true);
            }
            tokenRef.performUpdate();
        }
    }),
    new BattleAction('leave', false, true, (profile, map, token, args) => {
        if(!CommonBattleManager.isBattleActive(map)) return;
        
        const accessLevel = token.getAccessLevel(profile);
        if(Access.matches(Access.CONTROLLING_PLAYER, accessLevel)) {
            const tokenRef = new EntityReference(token);
            tokenRef.prop('battle_active').setBoolean(false);
            tokenRef.performUpdate();
        }
    })
];

export class BattleCommand extends Command {
    constructor(name, aliases) {
        super(name, aliases);
    }

    execute(profile, args) {
        // validate some input and find required objects
        const argsSplit = args.split(' ');
        if(argsSplit.length < 1) {
            ChatService.appendNote(profile, `Usage: /battle <action> ...`);
            return;
        }
        const map = EntityManagers.get('map').find(profile.getCurrentMap());
        if(!map) {
            ChatService.appendNote(profile, `Battle actions can only be performed on a map`);
            return;
        }
        const token = profile.getSelectedToken(true);

        // find action
        for(const action of ACTIONS) {
            if(action.name == argsSplit[0]) {
                // validate action requirements
                if(action.requiresGM && profile.getRole() != Role.GM) {
                    ChatService.appendNote(profile, `This action can only be performed by GMs`);
                    return;
                }
                if(action.requiresToken && !token) {
                    ChatService.appendNote(profile, `This action requries a selected token`);
                    return;
                }

                // perform action
                action.callback(profile, map, token, argsSplit.slice(1));
                return;
            }
        }

        // -> no action found
        ChatService.appendNote(profile, `Unknown battle action ${argsSplit[0]}`);
    }
}
