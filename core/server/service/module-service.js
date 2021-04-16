import path from 'path';
import fs from 'fs';

import { readJsonFile, saveJsonFile } from '../util/fileutil.js';
import { Definitions } from '../../common/common.js';
import { setDefinitions } from '../../common/definitions.js';
import { MessageService } from './message-service.js';
import { ModuleDefinitions } from '../../common/messages.js';
import { UserService } from './user-service.js';
import { Role } from '../../common/constants.js';

class Module {
    identifier;
    directory;
    definition;
    enabled;

    constructor(identifier, directory) {
        this.identifier = identifier;
        this.directory = directory;

        this.definition = readJsonFile(path.join(directory, 'module.json'));
        this.enabled = !this.definition.disabled;
    }

    saveDefinition() {
        saveJsonFile(path.join(this.directory, 'module.json'), this.definition, true);
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

        MessageService.send(new ModuleDefinitions(moduleDefinitions), profile);
    }

    static toggleModule(identifier, disabled) {
        for(const module of modules) {
            if(module.identifier == identifier) {
                module.definition.disabled = disabled;
                module.saveDefinition();
                this.broadcastModuleDefinitions();
                return;
            }
        }
    }
}
