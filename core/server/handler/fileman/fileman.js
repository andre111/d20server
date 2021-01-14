import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import gm from 'gm';
import multer  from 'multer';


export const EDIT_KEY = Math.trunc(Math.random() * 1144185);
export const router = express.Router();
const serverRoot = './data/files/';

/* List directory tree */
router.post('/dirlist', function(req, res) {
    //TODO: make this use async / promises aswell
    var response = [];  
    var filesRoot = '/';
    
    getDirectories(filesRoot, response);
    
    res.send(response);
});

/* List files in a directory */
router.post('/fileslist', function(req, res) {
    const pathDir = serverRoot + req.body.d;
    fs.readdir(pathDir)
    .then(files => {
        var response = [];

        files.map(file => {
            var fileDir = path.join(pathDir, file);
            var info = fs.statSync(fileDir); //TODO: is this sync call still a problem?
            if(info.isFile()) {
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
router.post('/copy', function(req, res) {
    if(req.body.k != EDIT_KEY) { res.send({ res: 'error', msg: 'access denied' }); return; }

    fs.copy(path.join(serverRoot, req.body.f || req.body.d), path.join(serverRoot, req.body.n))
    .then(() => res.send({ res: 'ok' }))
    .catch(err => res.send({ res:'error', msg: err }));
});

/* Create directory */
router.post('/createdir', function(req, res) {
    if(req.body.k != EDIT_KEY) { res.send({ res: 'error', msg: 'access denied' }); return; }

    fs.mkdirs(path.join(serverRoot, req.body.d, req.body.n))
    .then(() => res.send({ res: 'ok' }))
    .catch(err => res.send({ res:'error', msg: err }));
});

/* Delete a file or directory */
router.post('/delete', function(req, res) {
    if(req.body.k != EDIT_KEY) { res.send({ res: 'error', msg: 'access denied' }); return; }

    fs.remove(path.join(serverRoot, req.body.f || req.body.d))
    .then(() => res.send({ res: 'ok' }))
    .catch(err => res.send({ res:'error', msg: err }));
});

/* Move a file or directory */
router.post('/move', function(req, res) {
    if(req.body.k != EDIT_KEY) { res.send({ res: 'error', msg: 'access denied' }); return; }
    
    fs.move(path.join(serverRoot, req.body.f || req.body.d), path.join(serverRoot, req.body.n))
    .then(() => res.send({ res: 'ok' }))
    .catch(err => res.send({ res:'error', msg: err }));
});

/* Rename a file or directory */
router.post('/rename', function(req, res) {
    if(req.body.k != EDIT_KEY) { res.send({ res: 'error', msg: 'access denied' }); return; }

    var pathDir = path.dirname(req.body.f || req.body.d);
    fs.rename(path.join(serverRoot, req.body.f || req.body.d), path.join(serverRoot, pathDir, req.body.n))
    .then(() => res.send({ res: 'ok' }))
    .catch(err => res.send({ res:'error', msg: err }));
});

/* Generate thumbnail */
router.get('/generatethumb', function(req, res) {
    res.setHeader('content-type', 'image/png');

    const width = req.query.width || 120;
    const height = req.query.height || 120;
    
    gm(path.join(serverRoot, req.query.f))
    .resize(width, height, '^')
    .gravity('Center')
    .crop(width, height)
    .stream('png')
    .pipe(res);  
});

/* Upload files */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if(req.body.k != EDIT_KEY) { cb('access denied', null); return; }

        cb(null, path.join(serverRoot, req.body.d));
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage }).array('files[]');
router.post('/upload', function(req, res) {
    upload(req, res, function (err) {
        if (err) {
            res.send({ res:'error', msg: err });
        } else {
            res.send({ res: 'ok' });  
        }
    })  
});

//TODO: convert this to async / using promises too
function getDirectories(srcpath, response) {
    var info = {
        p: srcpath.replace(/\\/g, '/'),
        f: 0,
        d: 0
    };
    response.push(info);
    
    fs.readdirSync(serverRoot + srcpath).map(file => {
        var pathDir = path.join(srcpath, file);
        if(fs.statSync(serverRoot + pathDir).isDirectory()) {
            if(srcpath && srcpath != '/') info.d++;
            getDirectories(pathDir, response);
        } else {
            info.f++;
        }
    });
}
