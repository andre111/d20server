import { Message } from '../../../../core/common/message/message.js';
import { registerType } from '../../../../core/common/util/datautil.js';

export class WebRTCMessage extends Message {
    sender;

    type;
    dest;
    sdp;
    ice;

    constructor(type, dest, sdp, ice) {
        super();

        this.type = type;
        this.dest = dest;
        this.sdp = sdp;
        this.ice = ice;
    }
}
registerType(WebRTCMessage);
