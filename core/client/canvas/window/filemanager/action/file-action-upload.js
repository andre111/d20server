import { CanvasWindowFilemanagerUpload } from '../../canvas-window-filemanager-upload.js';
import { FileAction } from './file-action.js';

export class FileActionUpload extends FileAction {
    constructor(window) {
        super(window, 'Upload', 4);
    }

    showWithoutFile() {
        return true;
    }

    shouldShowFor(file) {
        return false;
    }

    applyTo(file) {
        if(this.window.getSelectedDirectory()) {
            new CanvasWindowFilemanagerUpload(this.window, this.window.getSelectedDirectory());
        }
    }
}
