import express from 'express';
import http from 'http';
import https from 'https';
import path from 'path';
import morgan from 'morgan';
import compression from 'compression';
import fs from 'fs-extra';
import { router as filemanRouter } from './filemanager.js';

import { ModuleService } from '../service/module-service.js';
import { buildIndexPage, getIndexPage } from './index-page.js';
import { WebsocketHandler } from './websocket-handler.js';

const port = 8082;
const server = express();
const baseServer = createBaseServer();
var isHTTPS = false;

function createBaseServer() {
    const privateKeyPath = path.join(path.resolve(), '/config/privkey.pem');
    const certificatePath = path.join(path.resolve(), '/config/fullchain.pem');
    if(fs.existsSync(privateKeyPath) && fs.existsSync(certificatePath)) {
        const privateKey = fs.readFileSync(privateKeyPath);
        const certificate = fs.readFileSync(certificatePath);

        isHTTPS = true;
        console.log('Creating HTTPS server...');
        return https.createServer({ key: privateKey, cert: certificate }, server);
    } else {
        console.log('Creating HTTP server...');
        return http.createServer(server);
    }
}

export class HttpHandler {
    static init() {
        server.use(morgan('dev'));
        server.use(compression());
        server.use(express.json());
        server.use(express.urlencoded({ extended: false }));

        // set csp settings for all following handlers
        //TODO: remove all inline styling (->template coloring, tinymce/htmlproperties) so I can limit style-src to self as well
        server.use(function(req, res, next) {
            res.setHeader('Content-Security-Policy', 'default-src \'self\'; img-src \'self\' data:; style-src \'self\' \'unsafe-inline\'');
            return next();
        });

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

        // file managers
        server.use('/fileman', filemanRouter);
        server.use('/data/files', express.static(path.join(path.resolve(), '/data/files')));

        // websocket handler
        WebsocketHandler.init(baseServer);

        // catch 404 and forward to error handler
        server.use(function(req, res, next) {
            res.status(404).send('Not found');
        });

        // start server
        baseServer.listen(port, (error) => {
            if(error) {
                console.error(error);
            } else {
                console.log(`Server listening on port ${port}`);
            }
        });
    }

    static getServer() {
        return server;
    }

    static isHTTPS() {
        return isHTTPS;
    }
}
