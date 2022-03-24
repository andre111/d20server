// @ts-check
import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class CopyEntity extends Message {
    manager;
    id;

    targetManager;
    modifiedProperties;

    constructor(manager, id, targetManager, modifiedProperties) {
        super();
        this.manager = manager;
        this.id = id;
        this.targetManager = targetManager;
        this.modifiedProperties = modifiedProperties;
    }

    getManager() {
        return this.manager;
    }

    getID() {
        return this.id;
    }

    getTargetManager() {
        return this.targetManager;
    }

    getModifiedProperties() {
        return this.modifiedProperties;
    }
}
registerType(CopyEntity);
