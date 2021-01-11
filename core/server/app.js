import { Common } from '../common/common.js';
import { EntityManagers } from '../common/entity/entity-managers.js';
import { ServerIDProvider } from './entity/id.js';
import { ServerEntityManager } from './entity/server-entity-manager.js';
import { setupCascadingDeletes } from './entity/server-entity-managers.js';
import { HttpHandler } from './handler/http-handler.js';
import { CommandLineService } from './service/command-line-service.js';
import { GameService } from './service/game-service.js';
import { ModuleService } from './service/module-service.js';
import { SaveService } from './service/save-service.js';

export const Server = {
    VERSION: 9
}

Common.init(new ServerIDProvider(), ServerEntityManager);
ModuleService.init(); // locate and load module definitions
EntityManagers.createAll(); // create entity managers
setupCascadingDeletes(); // sets up cascading entity deletes TODO: this is currently hardcoded, remove this!
SaveService.init(); // startup saveservice
GameService.init(); // startup game service (only does optinal init stuff)
HttpHandler.init(); // startup http and websocket server
CommandLineService.init(); // startup command line service
//TODO: dynamically load server sided module code

