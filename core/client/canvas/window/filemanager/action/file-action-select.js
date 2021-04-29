import { I18N } from '../../../../../common/util/i18n.js';
import { FileAction } from './file-action.js';

export class FileActionSelect extends FileAction {
    constructor(window) {
        super(window, I18N.get('filemanager.action.file.select', 'Select'), 5);
    }

    shouldShowFor(file) {
        return true;
    }

    applyTo(file) {
        this.window.selectFile(file);
        this.window.confirmSelection();
    }
}
