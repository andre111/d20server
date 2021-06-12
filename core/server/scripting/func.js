import { Role, Type } from '../../common/constants.js';
import { Events } from '../../common/events.js';
import { PlayEffect } from '../../common/messages.js';
import { Func } from '../../common/scripting/func.js';
import { RuntimeError } from '../../common/scripting/runtime-error.js';
import { Value } from '../../common/scripting/value.js';
import { ChatService } from '../service/chat-service.js';
import { MessageService } from '../service/message-service.js';

export const SERVER_BUILTIN_MOVECAMERA = new Func(3);
SERVER_BUILTIN_MOVECAMERA.call = (interpreter, paren, name, args) => {
    interpreter.checkOperandType(paren, args[0], Type.PLAYER);
    interpreter.checkOperandType(paren, args[1], Type.DOUBLE);
    interpreter.checkOperandType(paren, args[2], Type.DOUBLE);

    if(interpreter.getProfile() && interpreter.getProfile() != args[0].value && interpreter.getProfile().getRole() != Role.GM) {
        throw new RuntimeError(paren, 'Only the GM/Server is allowed to move the camera of another player');
    }

    const msg = new PlayEffect('NONE', args[1].value, args[2].value, 0, 1, false, true, '');
    MessageService.send(msg, args[0].value);
};

export const SERVER_BUILTIN_SENDCHAT = new Func(1);
SERVER_BUILTIN_SENDCHAT.call = (interpreter, paren, name, args) => {
    interpreter.checkOperandType(paren, args[0], Type.STRING);

    const profile = interpreter.getProfile();
    if(!profile) throw new RuntimeError(paren, 'No player to send this message in the current context');

    ChatService.onMessage(profile, args[0].value);
    return Value.NULL;
};

Events.on('serverCreateInterpreter', (event) => {
    event.data.interpreter.defineGlobal('moveCamera', SERVER_BUILTIN_MOVECAMERA);
    event.data.interpreter.defineGlobal('sendChat', SERVER_BUILTIN_SENDCHAT);
});
