import express from 'express';
import http from 'http';
import path from 'path';
import morgan from 'morgan';
import { router as filemanRouter } from './fileman/fileman.js';

import { ModuleService } from '../service/module-service.js';
import { buildIndexPage, getIndexPage } from './index-page.js';
import { WebsocketHandler } from './websocket-handler.js';

const server = express();
const baseServer = http.createServer(server);
const port = 8082;
export class HttpHandler {
    static init() {
        server.use(morgan('dev'));
        server.use(express.json());
        server.use(express.urlencoded({ extended: false }));

        // provide application data (including modules)
        server.use('/core/common', express.static(path.join(path.resolve(), '/core/common')));
        server.use('/core/client', express.static(path.join(path.resolve(), '/core/client')));
        server.use('/core/files', express.static(path.join(path.resolve(), '/core/files')));
        ModuleService.forEnabledModules(module => {
            server.use('/modules/'+module.getIdentifier()+'/common', express.static(path.join(module.getDirectory(), '/common')));
            server.use('/modules/'+module.getIdentifier()+'/client', express.static(path.join(module.getDirectory(), '/client')));
            server.use('/modules/'+module.getIdentifier()+'/files', express.static(path.join(module.getDirectory(), '/files')));
        });

        // index page
        buildIndexPage();
        server.get('/', getIndexPage);

        // TODO: remove: provide old image and audio entity data
        //server.use('/image', express.static(path.join(path.resolve(), '/data/entity/image'), { extensions: ['bin'], setHeaders: (res, path, stat) => { res.set('Content-Type', 'image/png') } }));
        //server.use('/audio', express.static(path.join(path.resolve(), '/data/entity/audio'), { extensions: ['bin'], setHeaders: (res, path, stat) => { res.set('Content-Type', 'application/ogg') } }));

        // file managers
        server.use('/fileman', filemanRouter);
        server.use('/data/files', express.static(path.join(path.resolve(), '/data/files')));

        // websocket handler
        WebsocketHandler.init(baseServer);

        // catch 404 and forward to error handler
        server.use(function(req, res, next) {
            //next(httperrors(404));
            res.status(404).send('Not found');
        });

        // start server
        baseServer.listen(port, () => {
            console.log(`Server listening on port ${port}`);
        });
    }

    static getServer() {
        return server;
    }
}
