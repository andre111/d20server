// @ts-check
import express from 'express';
import path from 'path';
import morgan from 'morgan';
import compression from 'compression';
import fs from 'fs-extra';
import spdy from 'spdy';

import { ModuleService } from '../service/module-service.js';
import { buildLangJson, getLangJson } from './lang-json.js';
import { buildIndexPage, getIndexPage } from './index-page.js';
import { FileManager } from './filemanager.js';
import { WebsocketHandler } from './websocket-handler.js';

var server = null;
var isHTTPS = false;
function createBaseServer(server) {
    var options = {};

    const privateKeyPath = path.join(path.resolve(), '/config/privkey.pem');
    const certificatePath = path.join(path.resolve(), '/config/fullchain.pem');
    if (fs.existsSync(privateKeyPath) && fs.existsSync(certificatePath)) {
        console.log('Enabling encryption...');
        options.key = fs.readFileSync(privateKeyPath);
        options.cert = fs.readFileSync(certificatePath);
        isHTTPS = true;
    } else {
        options.spdy = {
            plain: true,
            ssl: false
        };
    }
    console.log('Starting server...');
    return spdy.createServer(options, server);
}

export class HttpHandler {
    static init(port = 8082) {
        server = express();
        const baseServer = createBaseServer(server);

        server.use(morgan('dev'));
        server.use(compression());
        server.use(express.json());
        server.use(express.urlencoded({ extended: false }));

        // set csp settings for all following handlers
        //TODO: remove all inline styling (->template coloring, tinymce/htmlproperties) so I can limit style-src to self as well
        server.use(function (req, res, next) {
            res.setHeader('Content-Security-Policy', 'default-src \'self\'; img-src \'self\' data:; style-src \'self\' \'unsafe-inline\'');
            return next();
        });

        // provide application data (including modules)
        server.use('/core/common', express.static(path.join(path.resolve(), '/core/common')));
        server.use('/core/client', express.static(path.join(path.resolve(), '/core/client')));
        server.use('/core/files', express.static(path.join(path.resolve(), '/core/files')));
        ModuleService.forEnabledModules(module => {
            server.use('/modules/' + module.getIdentifier() + '/common', express.static(path.join(module.getDirectory(), '/common')));
            server.use('/modules/' + module.getIdentifier() + '/client', express.static(path.join(module.getDirectory(), '/client')));
            server.use('/modules/' + module.getIdentifier() + '/files', express.static(path.join(module.getDirectory(), '/files')));
        });

        // language json
        buildLangJson();
        server.get('/lang.json', getLangJson);

        // index page
        buildIndexPage();
        server.get('/', getIndexPage);

        // file manager and access
        FileManager.init();
        server.use('/fileman', FileManager.router);
        server.use('/data/files', express.static(path.join(path.resolve(), FileManager.serverRoot)));

        // websocket handler
        WebsocketHandler.init(baseServer);

        // catch 404 and forward to error handler
        server.use(function (req, res, next) {
            res.status(404).send('Not found');
        });

        // start server
        baseServer.listen(port, (error) => {
            if (error) {
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
