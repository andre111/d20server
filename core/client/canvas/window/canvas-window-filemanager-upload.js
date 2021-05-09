import { CanvasWindow } from '../canvas-window.js';
import { toFormatedSize } from '../../../common/util/datautil.js';
import { I18N } from '../../../common/util/i18n.js';

export class CanvasWindowFilemanagerUpload extends CanvasWindow {
    window;
    directory;

    form;
    inputDirPath;
    inputFiles;
    divFileList;

    uploadFileList;

    constructor(window, directory) {
        super(window, I18N.get('filemanager.uploadwindow', 'Upload files'), true);

        this.window = window;
        this.directory = directory;

        this.uploadFileList = [];

        this.createForm();
        this.createButtons();
        this.setDimensions(400, 400);
        this.center();
    }

    createForm() {
        this.form = document.createElement('form');
        this.content.appendChild(this.form);

        const div = document.createElement('div');
        this.form.appendChild(div);

        this.inputFiles = document.createElement('input');
        this.inputFiles.type = 'file';
        this.inputFiles.name = 'files[]';
        this.inputFiles.multiple = 'multiple';
        this.inputFiles.onchange = () => this.updateList();
        div.appendChild(this.inputFiles);

        this.divFileList = document.createElement('div');
        div.appendChild(this.divFileList);
    }

    createButtons() {
        this.addButton(I18N.get('global.ok', 'Ok'), () => {
            this.doUpload();
        });
        this.addButton(I18N.get('global.cancel', 'Cancel'), () => {
            this.doCancel();
        });
    }

    updateList() {
        // read files and reset input
        const files = this.inputFiles.files;
        this.inputFiles.files = null; //TODO: how to actually reset this

        // append to internal list
        for(var i=0; i<files.length; i++) {
            this.uploadFileList.push({
                file: files[i]
            });
        }

        // update gui
        this.divFileList.innerHTML = '';
        for(var i=0; i<this.uploadFileList.length; i++) {
            const div = document.createElement('div');
            div.className = 'fileman-fileupload';
            this.divFileList.appendChild(div);

            const nameDiv = document.createElement('div');
            nameDiv.className = 'fileman-fileupload-name';
            nameDiv.innerHTML = this.uploadFileList[i].file.name + ' (' + toFormatedSize(this.uploadFileList[i].file.size) + ')';
            div.appendChild(nameDiv);

            const progressDiv = document.createElement('div');
            progressDiv.className = 'fileman-fileupload-progress';
            nameDiv.appendChild(progressDiv);
            const stripes = document.createElement('div');
            stripes.classList = 'fileman-stripes';
            progressDiv.appendChild(stripes);

            // attach elements for later reference
            this.uploadFileList[i].div = div;
            this.uploadFileList[i].progressDiv = progressDiv;
        }
    }

    doUpload() {
        for(var i=0; i<this.uploadFileList.length; i++) {
            const fileEntry = this.uploadFileList[i];
            if(fileEntry.started) continue;
            fileEntry.started = true;

            // create form data
            const formData = new FormData();
            formData.append('action', 'upload');
            formData.append('method', 'ajax');
            formData.append('k', this.window.getKey());
            formData.append('d', this.directory.getPath());
            formData.append('files[]', fileEntry.file);

            // create request with listeners
            const request = new XMLHttpRequest();
            request.upload.addEventListener('progress', e => { this.onUploadProgress(fileEntry, e); }, false);
            request.addEventListener('load', e => { this.onUploadEnded(fileEntry, e, 'ok'); }, false);
            request.addEventListener('error', e => { this.onUploadEnded(fileEntry, e, 'error'); }, false);
            request.addEventListener('abort', e => { this.onUploadEnded(fileEntry, e, 'abort'); }, false);

            // open request and send data
            request.open('POST', '/fileman/upload', true);
            request.setRequestHeader('Accept', '*/*');
            request.send(formData);
        }
    }

    doCancel() {
        //TODO: maybe cancel started uploads (could be a bit tricky)
        this.close();
    }

    onUploadProgress(fileEntry, event) {
        var percent = 99;
        if(event.lengthComputable) {
            percent = Math.floor((event.loaded / event.total) * 100);
            if(percent > 99) percent = 99;
        }

        fileEntry.progressDiv.style.width = String(percent) + '%';
    }

    onUploadEnded(fileEntry, event, result) {
        // check server response
        var response = null;
        try {
            response = JSON.parse(event.target.responseText);
        } catch(error) {}

        // check success status
        const success = !(response && response.res == 'error') && result == 'ok';

        // update gui
        fileEntry.progressDiv.style.width = '100%';
        fileEntry.progressDiv.innerHTML = '';
        if(success) {
            fileEntry.progressDiv.className += ' fileman-fileupload-done';
            fileEntry.done = true;
        } else {
            fileEntry.progressDiv.className += ' fileman-fileupload-error';
        }

        // refresh window (by reselecting the current directory)
        if(success) {
            this.window.selectDirectory(this.window.getSelectedDirectory(), true);
        }
    }
}
