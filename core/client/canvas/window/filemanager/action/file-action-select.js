import { FileAction } from './file-action.js';

export class FileActionSelect extends FileAction {
    constructor(window) {
        super(window, 'Select', 5);
    }

    shouldShowFor(file) {
        return true;
    }

    applyTo(file) {
        this.window.selectFile(file);
        this.window.confirmSelection();
    }
}
