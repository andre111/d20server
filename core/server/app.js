// @ts-check
// this NEEDS to be the first import to handle argument parsing before all other code
import { PARAMETERS } from './parameters.js';

import { Common } from '../common/common.js';
import { EntityManagers } from '../common/entity/entity-managers.js';
import { Events } from '../common/events.js';
import { ServerIDProvider } from './entity/id.js';
import { ServerEntityManager } from './entity/server-entity-manager.js';
import { HttpHandler } from './handler/http-handler.js';
import { CommandLineService } from './service/command-line-service.js';
import { GameService } from './service/game-service.js';
import { ModuleService } from './service/module-service.js';
import { CONFIG } from '../common/config.js';
import { readJsonFile } from './util/fileutil.js';
import './handler/message-handler.js';
import './scripting/func.js';

// load config
CONFIG.load(readJsonFile('./' + PARAMETERS.datadir + '/config.json'));

// start server
Common.init(true, new ServerIDProvider(), ServerEntityManager);
ModuleService.init().then(() => { // locate and load module definitions and dynamically load server sided module code
    EntityManagers.createAll(() => { // create entity managers
        GameService.init(); // startup game service (only does optinal init stuff)
        HttpHandler.init(PARAMETERS.port); // startup http and websocket server
        CommandLineService.init(); // startup command line service
        Events.trigger('serverInit');
    });
});
