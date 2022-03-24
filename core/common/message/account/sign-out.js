// @ts-check
import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class SignOut extends Message {
}
registerType(SignOut);
