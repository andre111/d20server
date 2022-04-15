// @ts-check
import { Role, Type } from '../../common/constants.js';
import { EntityReference } from '../../common/entity/entity-reference.js';
import { Events } from '../../common/events.js';
import { PlayEffect } from '../../common/messages.js';
import { Profile } from '../../common/profile.js';
import { defineBuiltinFunc } from '../../common/scripting/func.js';
import { Interpreter } from '../../common/scripting/interpreter.js';
import { RuntimeError } from '../../common/scripting/runtime-error.js';
import { ScrArray } from '../../common/scripting/scrarray.js';
import { Token } from '../../common/scripting/token.js';
import { Value } from '../../common/scripting/value.js';
import { ChatService } from '../service/chat-service.js';
import { MessageService } from '../service/message-service.js';
import { UserService } from '../service/user-service.js';

/**
 * Checks whether the provided player / profile should be accessable by the scripting system.
 * This means that either it is running on system or gm level, or the executing player matches the provided one.
 * @param {Interpreter} interpreter the interpreter to check
 * @param {Profile} player the player / profile to be checked for access
 * @param {Token} paren the token used to locate the potential error
 * @throws {RuntimeError} an Error when access is forbidden
 */
function checkPlayerAccess(interpreter, player, paren) {
    if (interpreter.getProfile() && interpreter.getProfile() != player && interpreter.getProfile().getRole() != Role.GM) {
        throw new RuntimeError(paren, 'Only the GM/Server is allowed to access another player');
    }
}

const SERVER_BUILTIN_GETCONTROLLINGPLAYERS = defineBuiltinFunc(1, (interpreter, paren, name, args) => {
    interpreter.checkOperandType(paren, args[0], Type.ENTITY);

    const array = new ScrArray();
    var index = 0;
    for (const playerID of args[0].value.getControllingPlayers()) {
        array.set(index, new Value(UserService.getProfile(playerID), Type.PLAYER, ''));
        index++;
    }
    return array;
});

const SERVER_BUILTIN_GETSELECTEDTOKENS = defineBuiltinFunc(1, (interpreter, paren, name, args) => {
    interpreter.checkOperandType(paren, args[0], Type.PLAYER);
    checkPlayerAccess(interpreter, args[0].value, paren);

    const array = new ScrArray();
    var index = 0;
    for (const entity of args[0].value.getSelectedTokens()) {
        array.set(index, new Value(new EntityReference(entity), Type.ENTITY, ''));
        index++;
    }
    return array;
});

const SERVER_BUILTIN_GETSELECTINGPLAYERS = defineBuiltinFunc(1, (interpreter, paren, name, args) => {
    interpreter.checkOperandType(paren, args[0], Type.ENTITY);
    if (args[0].value.type != 'token') throw new RuntimeError(paren, 'Can only get selecting players on a token');

    const array = new ScrArray();
    var index = 0;
    UserService.forEach(player => {
        if (player.getSelectedTokens().includes(args[0].value)) {
            array.set(index, new Value(player, Type.PLAYER, ''));
            index++;
        }
    });
    return array;
});

const SERVER_BUILTIN_MOVECAMERA = defineBuiltinFunc(3, (interpreter, paren, name, args) => {
    interpreter.checkOperandType(paren, args[0], Type.PLAYER);
    interpreter.checkOperandType(paren, args[1], Type.DOUBLE);
    interpreter.checkOperandType(paren, args[2], Type.DOUBLE);
    checkPlayerAccess(interpreter, args[0].value, paren);

    const msg = new PlayEffect('NONE', args[1].value, args[2].value, 0, 1, false, true, '');
    MessageService.send(msg, args[0].value);
    return Value.NULL;
});

const SERVER_BUILTIN_SENDCHAT = defineBuiltinFunc(1, (interpreter, paren, name, args) => {
    interpreter.checkOperandType(paren, args[0], Type.STRING);

    const profile = interpreter.getProfile();
    if (!profile) throw new RuntimeError(paren, 'No player to send this message in the current context');

    ChatService.onMessage(profile, args[0].value);
    return Value.NULL;
});

Events.on('createInterpreter', (event) => {
    event.data.interpreter.defineGlobal('getControllingPlayers', SERVER_BUILTIN_GETCONTROLLINGPLAYERS);
    event.data.interpreter.defineGlobal('getSelectedTokens', SERVER_BUILTIN_GETSELECTEDTOKENS);
    event.data.interpreter.defineGlobal('getSelectingPlayers', SERVER_BUILTIN_GETSELECTINGPLAYERS);
    event.data.interpreter.defineGlobal('moveCamera', SERVER_BUILTIN_MOVECAMERA);
    event.data.interpreter.defineGlobal('sendChat', SERVER_BUILTIN_SENDCHAT);
});
