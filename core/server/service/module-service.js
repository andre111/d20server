import path from 'path';
import fs from 'fs';

import { readJsonFile } from '../util/fileutil.js';
import { Definitions } from '../../common/common.js';
import { setDefinitions } from '../../common/definitions.js';
import { MessageService } from './message-service.js';
import { ModuleDefinitions } from '../../common/messages.js';
import { UserService } from './user-service.js';
import { Role } from '../../common/constants.js';
import { CONFIG } from '../config.js';
import { I18N } from '../../common/util/i18n.js';

class Module {
    identifier;
    directory;
    definition;
    enabled;

    constructor(identifier, directory) {
        this.identifier = identifier;
        this.directory = directory;

        this.definition = readJsonFile(path.join(directory, 'module.json'));
        this.enabled = !CONFIG.get().disabledModules.includes(identifier);
    }

    getIdentifier() {
        return this.identifier;
    }

    getDirectory() {
        return this.directory;
    }

    getDefinition() {
        return this.definition;
    }

    isEnabled() {
        return this.enabled;
    }
}

var modules = [];
export class ModuleService {
    static async init() {
        // "init" config
        //TODO: move this to an actual "config option definition" system
        CONFIG.get().disabledModules = CONFIG.get().disabledModules ?? [];
        CONFIG.get().language = CONFIG.get().language ?? 'de_DE';
        CONFIG.get().gmLockout = CONFIG.get().gmLockout ?? false;
        CONFIG.get().motd = CONFIG.get().motd ?? '';

        // scan for modules
        fs.readdirSync(path.join(path.resolve(), '/modules/')).forEach(file => {
            const directory = path.join(path.resolve(), '/modules/'+file+'/');
            if(fs.statSync(directory).isDirectory()) {
                // check for module definition and add module
                if(fs.existsSync(path.join(directory, 'module.json'))) {
                    modules.push(new Module(file, directory));
                }
            }
        });

        // load i18n files
        ModuleService.loadI18N();

        // load definitions
        ModuleService.loadDefinitions();

        // load code
        for(const module of modules) {
            if(module.isEnabled()) {
                const commonJSFile = path.join(module.getDirectory(), '/common/module.js');
                if(fs.existsSync(commonJSFile)) {
                    await import('../../../modules/'+module.getIdentifier()+'/common/module.js');
                }

                const serverJSFile = path.join(module.getDirectory(), '/server/module.js');
                if(fs.existsSync(serverJSFile)) {
                    await import('../../../modules/'+module.getIdentifier()+'/server/module.js');
                }
            }
        }
    }

    static loadI18N() {
        const loadLangFile = file => { if(fs.existsSync(file)) I18N.mergeObject(readJsonFile(file)); };
        const lang = CONFIG.get().language;

        loadLangFile('./core/i18n/'+lang+'.json');
        ModuleService.forEnabledModules(module => loadLangFile(path.join(module.getDirectory(), 'i18n/'+lang+'.json')));
    }

    static loadDefinitions() {
        const definitions = new Definitions();

        for(const [name, file] of Object.entries(ModuleService.getFilesIn('/entities/'))) {
            if(name.endsWith('.json')) {
                // read basic entity definition
                const type = name.substring(0, name.length-5);
                const entityDefinition = readJsonFile(file);
                console.log(`Entity: ${type}`);

                // read extension definitions
                for(const extensionPoint of entityDefinition.extensionPoints) {
                    extensionPoint.extensionDefinitions = {};
                    for(const [ename, efile] of Object.entries(ModuleService.getFilesIn('/entities/extensions/'+type+'/'+extensionPoint.name+'/'))) {
                        if(ename.endsWith('.json')) {
                            const extensionName = ename.substring(0, ename.length-5);
                            const extensionDefinition = readJsonFile(efile);
                            console.log('    '+extensionPoint.name+': '+extensionName);

                            // add extension definition
                            extensionPoint.extensionDefinitions[extensionName] = extensionDefinition;
                        }
                    }
                }

                // add entity definition
                definitions.addEntityDefinition(type, entityDefinition);
            }
        }

        setDefinitions(definitions);
    }

    static forEnabledModules(func) {
        for(const module of modules) {
            if(module.isEnabled()) {
                func(module);
            }
        }
    }

    static getFilesIn(dirPath) {
        var files = {};
        const fileScanner = (dir) => {
            if(fs.existsSync(dir)) {
                fs.readdirSync(dir).forEach(file => {
                    files[file] = path.join(dir, file);
                });
            }
        };

        // Scan core + enabled modules
        fileScanner(path.join(path.resolve(), '/core' + dirPath));
        ModuleService.forEnabledModules(module => {
            const dir = path.join(module.getDirectory(), dirPath);
            fileScanner(dir);
        });
        return files;
    }

    static broadcastModuleDefinitions() {
        UserService.forEach(profile => {
            if(profile.getRole() == Role.GM) this.sendModuleDefinitions(profile);
        });
    }

    static sendModuleDefinitions(profile) {
        var moduleDefinitions = {};
        for(const module of modules) {
            moduleDefinitions[module.identifier] = module.definition;
        }

        MessageService.send(new ModuleDefinitions(moduleDefinitions, CONFIG.get().disabledModules), profile);
    }

    static toggleModule(identifier, disabled) {
        const index = CONFIG.get().disabledModules.indexOf(identifier);
        if(disabled) {
            if(index == -1) CONFIG.get().disabledModules.push(identifier);
        } else {
            if(index >= 0) CONFIG.get().disabledModules.splice(index, 1);
        }
        CONFIG.save();
        ModuleService.broadcastModuleDefinitions();
    }
}
