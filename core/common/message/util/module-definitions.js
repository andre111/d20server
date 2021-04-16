import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class ModuleDefinitions extends Message {
    moduleDefinitions;

    constructor(moduleDefinitions) {
        super();
        this.moduleDefinitions = moduleDefinitions;
    }

    getModuleDefinitions() {
        return this.moduleDefinitions;
    }
}
registerType(ModuleDefinitions);
