// @ts-check
import { Message } from '../message.js';
import { registerType } from '../../util/datautil.js';

export class ModuleDefinitions extends Message {
    moduleDefinitions;
    disabledModules;

    constructor(moduleDefinitions, disabledModules) {
        super();
        this.moduleDefinitions = moduleDefinitions;
        this.disabledModules = disabledModules;
    }

    getModuleDefinitions() {
        return this.moduleDefinitions;
    }

    getDisabledModules() {
        return this.disabledModules;
    }
}
registerType(ModuleDefinitions);
