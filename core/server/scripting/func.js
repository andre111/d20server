import { Type } from '../../common/constants.js';
import { Func } from '../../common/scripting/func.js';
import { RuntimeError } from '../../common/scripting/runtime-error.js';
import { Value } from '../../common/scripting/value.js';
import { ChatService } from '../service/chat-service.js';

export const SERVER_BUILTIN_SENDCHAT = new Func(1);
SERVER_BUILTIN_SENDCHAT.call = (interpreter, paren, name, args) => {
    interpreter.checkOperandType(paren, args[0], Type.STRING);

    const profile = interpreter.getProfile();
    if(!profile) throw new RuntimeError(paren, 'No player to send this message in the current context');

    ChatService.onMessage(profile, args[0].value);
    return Value.NULL;
};
