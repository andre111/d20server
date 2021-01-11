import path from 'path';
import { readFileSync } from 'fs';

import { ModuleService } from '../service/module-service.js';

var text = '';
export function buildIndexPage() {
    // collect module files
    var moduleScripts = '';
    var moduleStyles = '';
    var moduleLibraries = '';
    ModuleService.forEnabledModules(module => {
        moduleScripts = moduleScripts + `        <script src="/modules/${module.getIdentifier()}/client/module.js" type="module"></script>\n`;
        moduleStyles = moduleStyles + `        <link rel="stylesheet" href="/modules/${module.getIdentifier()}/files/module.css">\n`;
        if(module.getDefinition().libraries) {
            for(const library of module.getDefinition().libraries) {
                moduleLibraries = moduleLibraries + `        <script src="/modules/${module.getIdentifier()}/files${library}"></script>\n`;
            }
        }
    });

    // create index page string
    const file = path.join(path.resolve(), '/core/index.html');
    text = readFileSync(file, 'utf-8');
    text = text.replace('!MODULE_SCRIPTS!', moduleScripts);
    text = text.replace('!MODULE_STYLES!', moduleStyles);
    text = text.replace('!MODULE_LIBRARIES!', moduleLibraries);
}

export function getIndexPage(req, res, next) {
    if(!req.path || req.path == '' || req.path == '/') {
        res.send(text);
    } else {
        next();
    }
}
