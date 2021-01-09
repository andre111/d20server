import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class ActionCommand extends Message {
    command;
    id;
    x;
    y;
    modified;
    text;

    sender;
    gm;

    constructor(command, id, x, y, modified, text, sender, gm) {
        super();
        this.command = command;
        this.id = id;
        this.x = x;
        this.y = y;
        this.modified = modified;
        this.text = text;
        this.sender = sender;
        this.gm = gm;
    }

    getCommand() {
        return this.command;
    }

    getID() {
        return this.id;
    }

    getX() {
        return this.x;
    }

    getY() {
        return this.y;
    }

    isModified() {
        return this.modified;
    }

    getText() {
        return this.text;
    }

    getSender() {
        return this.sender;
    }

    isGM() {
        return this.gm;
    }
}
registerType(ActionCommand);
