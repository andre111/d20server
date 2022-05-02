// @ts-check
import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import sharp from 'sharp';
import multer from 'multer';

import { PARAMETERS } from '../parameters.js';
import { getFileType } from '../../common/util/datautil.js';

/* TODO: verify this has enough validation so you cannot for example delete any file on the system */
export const EDIT_KEY = Math.trunc(Math.random() * 1144185);

//TODO: convert this to async / using promises too
function getDirectories(srcpath, response) {
    var info = {
        p: srcpath.replace(/\\/g, '/'),
        f: 0,
        d: 0
    };
    response.push(info);

    fs.readdirSync(FileManager.serverRoot + srcpath, { withFileTypes: true }).map(file => {
        var pathDir = path.join(srcpath, file.name);
        if (file.isDirectory()) {
            if (srcpath && srcpath != '/') info.d++;
            getDirectories(pathDir, response);
        } else {
            info.f++;
        }
    });
}

function validatePath(inputPath) {
    // find file/dir name
    var inputName = inputPath;
    if (inputName.includes(path.sep)) {
        inputName = inputName.substring(inputName.lastIndexOf(path.sep) + 1);
    }

    // only allow files with known "good" endings
    if (inputName.includes('.')) {
        const fileType = getFileType(inputPath);
        if (!fileType.allowsUpload()) {
            return false;
        }
    }

    /* TODO: Verify this is enough to limit user actions to inside the files directory */
    // only allow relative paths that do not move upwards */
    const relativePath = path.relative(FileManager.serverRoot, inputPath);
    const isRoot = relativePath === '';
    const isContained = relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath);

    return isRoot || isContained;
}

export class FileManager {
    static router;
    static serverRoot;

    static init() {
        const router = FileManager.router = express.Router();
        const serverRoot = FileManager.serverRoot = './' + PARAMETERS.datadir + '/files/';

        /* List directory tree */
        router.post('/dirlist', function (req, res) {
            //TODO: make this use async / promises aswell
            var response = [];
            var filesRoot = '/';

            getDirectories(filesRoot, response);

            res.send(response);
        });

        /* List files in a directory */
        router.post('/fileslist', function (req, res) {

            // create and validate path
            const dirPath = path.join(serverRoot, req.body.d);
            if (!validatePath(dirPath)) { res.send({ res: 'error', msg: 'invalid path' }); return; }

            // read files
            fs.readdir(dirPath)
                .then(files => {
                    var response = [];

                    files.map(file => {
                        const fileDir = path.join(dirPath, file);
                        const info = fs.statSync(fileDir); //TODO: is this sync call still a problem?
                        if (info.isFile()) {
                            response.push({
                                p: path.join(req.body.d, file).replace(/\\/g, '/'),
                                s: info.size,
                                t: (info.mtime.getTime() / 1000).toFixed(0)
                            });
                        }
                    });

                    res.send(response);
                })
                .catch(err => {
                    //TODO...
                });
        });

        /* Copying a file or directory */
        router.post('/copy', function (req, res) {
            if (req.body.k != EDIT_KEY) { res.send({ res: 'error', msg: 'access denied' }); return; }

            // create and validate paths
            const oldPath = path.join(serverRoot, req.body.f || req.body.d);
            const newPath = path.join(serverRoot, req.body.n);
            if (!validatePath(oldPath)) { res.send({ res: 'error', msg: 'invalid path' }); return; }
            if (!validatePath(newPath)) { res.send({ res: 'error', msg: 'invalid path' }); return; }

            // perform copy
            fs.copy(oldPath, newPath)
                .then(() => res.send({ res: 'ok' }))
                .catch(err => res.send({ res: 'error', msg: err }));
        });

        /* Create directory */
        router.post('/createdir', function (req, res) {
            if (req.body.k != EDIT_KEY) { res.send({ res: 'error', msg: 'access denied' }); return; }

            // create and validate path
            const dirPath = path.join(serverRoot, req.body.d, req.body.n);
            if (!validatePath(dirPath)) { res.send({ res: 'error', msg: 'invalid path' }); return; }

            // perform mkdirs
            fs.mkdirs(dirPath)
                .then(() => res.send({ res: 'ok' }))
                .catch(err => res.send({ res: 'error', msg: err }));
        });

        /* Delete a file or directory */
        router.post('/delete', function (req, res) {
            if (req.body.k != EDIT_KEY) { res.send({ res: 'error', msg: 'access denied' }); return; }

            // create and validate path
            const filePath = path.join(serverRoot, req.body.f || req.body.d);
            if (!validatePath(filePath)) { res.send({ res: 'error', msg: 'invalid path' }); return; }

            // perform remove
            fs.remove(filePath)
                .then(() => res.send({ res: 'ok' }))
                .catch(err => res.send({ res: 'error', msg: err }));
        });

        /* Move a file or directory */
        router.post('/move', function (req, res) {
            if (req.body.k != EDIT_KEY) { res.send({ res: 'error', msg: 'access denied' }); return; }

            // create and validate paths
            const oldPath = path.join(serverRoot, req.body.f || req.body.d);
            const newPath = path.join(serverRoot, req.body.n);
            if (!validatePath(oldPath)) { res.send({ res: 'error', msg: 'invalid path' }); return; }
            if (!validatePath(newPath)) { res.send({ res: 'error', msg: 'invalid path' }); return; }

            // perform move
            fs.move(oldPath, newPath)
                .then(() => res.send({ res: 'ok' }))
                .catch(err => res.send({ res: 'error', msg: err }));
        });

        /* Rename a file or directory */
        router.post('/rename', function (req, res) {
            if (req.body.k != EDIT_KEY) { res.send({ res: 'error', msg: 'access denied' }); return; }

            // create and validate paths
            const pathDir = path.dirname(req.body.f || req.body.d);
            const oldPath = path.join(serverRoot, req.body.f || req.body.d);
            const newPath = path.join(serverRoot, pathDir, req.body.n);
            if (!validatePath(oldPath)) { res.send({ res: 'error', msg: 'invalid path' }); return; }
            if (!validatePath(newPath)) { res.send({ res: 'error', msg: 'invalid path' }); return; }

            // perform rename
            fs.rename(oldPath, newPath)
                .then(() => res.send({ res: 'ok' }))
                .catch(err => res.send({ res: 'error', msg: err }));
        });

        /* Generate thumbnail */
        router.get('/generatethumb', function (req, res) {
            res.setHeader('content-type', 'image/webp');

            const width = Math.max(0, Math.min(Number(req.query.width) || 120, 120));
            const height = Math.max(0, Math.min(Number(req.query.height) || 120, 120));

            // create and validate path
            const filePath = path.join(serverRoot, String(req.query.f));
            if (!validatePath(filePath)) { res.send({ res: 'error', msg: 'invalid path' }); return; }

            // generate thumbnail (TODO: on the fly operation simply seems to be to expensive)
            sharp(filePath).resize(width, height).webp().pipe(res);
        });

        /* Upload files */
        const storage = multer.diskStorage({
            destination: function (req, file, cb) {
                if (req.body.k != EDIT_KEY) { cb(new Error('access denied'), null); return; }

                // create and validate path
                const dirPath = path.join(serverRoot, req.body.d);
                if (!validatePath(dirPath)) { cb(new Error('invalid path'), null); return; }
                const filePath = path.join(dirPath, file.originalname);
                if (!validatePath(filePath)) { cb(new Error('invalid path'), null); return; }

                cb(null, dirPath);
            },
            filename: function (req, file, cb) {
                cb(null, file.originalname);
            }
        });

        const upload = multer({ storage: storage }).array('files[]');
        router.post('/upload', function (req, res) {
            upload(req, res, function (err) {
                if (err) {
                    res.send({ res: 'error', msg: err });
                } else {
                    res.send({ res: 'ok' });
                }
            })
        });
    }
}
