import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class RequestAccounts extends Message {
    requiresAuthentication() {
        return false;
    }
}
registerType(RequestAccounts);
