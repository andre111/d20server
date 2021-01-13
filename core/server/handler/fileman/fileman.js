import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import gm from 'gm';
import multer  from 'multer';


export const EDIT_KEY = Math.trunc(Math.random() * 1144185);
export const router = express.Router();
var serverRoot = './data/files/';

/* List directory tree */
router.post('/dirlist', function(req, res) {
    var response = [];  
    var filesRoot = '/';
    
    getDirectories(filesRoot, response);
    
    res.send(response);
});

/* List files in a directory */
router.post('/fileslist', function(req, res) {
    var response = [];
    var pathDir = serverRoot + req.body.d;
    fs.readdirSync(pathDir).map(function(file) {
        var fileDir = path.join(pathDir, file);
        var info = fs.statSync(fileDir); 
        if(info.isFile()) {
            response.push({ 
                p: path.join(req.body.d, file).replace(/\\/g, '/'), 
                s: info.size,
                t: (info.mtime.getTime() / 1000).toFixed(0)
            });
        }
    });
    
    res.send(response);
});

/* Copying a file or directory */
router.post('/copy', function(req, res) {
    if(req.body.k != EDIT_KEY) { res.send({ res: 'error', msg: 'access denied' }); return; }

    try {
        fs.copySync(path.join(serverRoot, req.body.f || req.body.d), path.join(serverRoot, req.body.n));
        res.send({ res: 'ok', msg: 'Success' });
    } catch (err) {
        res.send({ res:'error', msg: err });
    }
});

/* Create directory */
router.post('/createdir', function(req, res) {
    if(req.body.k != EDIT_KEY) { res.send({ res: 'error', msg: 'access denied' }); return; }

    try {
        fs.mkdirsSync(path.join(serverRoot, req.body.d, req.body.n));
        res.send({ res: 'ok', msg: 'Success' });
    } catch (err) {
        res.send({ res:'error', msg: err });
    }
});

/* Delete a file or directory */
router.post('/delete', function(req, res) {
    if(req.body.k != EDIT_KEY) { res.send({ res: 'error', msg: 'access denied' }); return; }

    try {
        fs.removeSync(path.join(serverRoot, req.body.f || req.body.d));
        res.send({ res: 'ok', msg: 'Success' });
    } catch (err) {
        res.send({ res:'error', msg: err });
    }
});

/* Move a file or directory */
router.post('/move', function(req, res) {
    if(req.body.k != EDIT_KEY) { res.send({ res: 'error', msg: 'access denied' }); return; }
    
    fs.move(path.join(serverRoot, req.body.f || req.body.d), path.join(serverRoot, req.body.n), function (err) {
        if (err) {
            res.send({ res:'error', msg: err });
        }
        else{
            res.send({ res: 'ok', msg: 'Success' });
        }
    });
});

/* Rename a file or directory */
router.post('/rename', function(req, res) {
    if(req.body.k != EDIT_KEY) { res.send({ res: 'error', msg: 'access denied' }); return; }

    var pathDir = path.dirname(req.body.f || req.body.d);
    try {
        fs.renameSync(path.join(serverRoot, req.body.f || req.body.d), path.join(serverRoot, pathDir, req.body.n));
        res.send({ res: 'ok', msg: 'Success' });
    } catch (err) {
        res.send({ res:'error', msg: err });
    }
});

/* Generate thumbnail */
router.get('/generatethumb', function(req, res) {
    res.setHeader('content-type', 'image/png');
    
    gm(path.join(serverRoot, req.query.f))
    .resize(req.query.width || '200', req.query.height || '200', '^')
    .gravity('Center')
    .crop(req.query.width || '200', req.query.height || '200')
    .stream('png')
    .pipe(res);  
});

/* Upload files */
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if(req.body.k != EDIT_KEY) { cb('access denied', null); return; }

        cb(null, path.join(serverRoot, req.body.d));
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

var upload = multer({ storage: storage }).array('files[]');
router.post('/upload', function(req, res) {
    upload(req, res, function (err) {
        if (err) {
            res.send({ res:'error', msg: err });
        }
        else{
            res.send({ res: 'ok', msg: 'Success' });  
        }
    })  
});

var getDirectories = function(srcpath, response) {
  
    var info = {
        p: srcpath.replace(/\\/g, '/'),
        f: 0,
        d: 0
    };
    response.push(info);
    
    fs.readdirSync(serverRoot + srcpath).map(function(file) {
        var pathDir = path.join(srcpath, file);
        if(fs.statSync(serverRoot + pathDir).isDirectory()){
            if(srcpath && srcpath != '/') info.d++;
            getDirectories(pathDir, response);
        } else {
            info.f++;
        }
    });
};
