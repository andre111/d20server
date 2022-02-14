import { DirectoryAction } from './directory-action.js';
import { CanvasWindowConfirm } from '../../canvas-window-confirm.js';
import { I18N } from '../../../../../common/util/i18n.js';
import { fetchDynamicJSON } from '../../../../util/fetchutil.js';

export class DirectoryActionDelete extends DirectoryAction {
    constructor(window) {
        super(window, I18N.get('filemanager.action.directory.delete.name', 'Delete'), 2);
    }

    shouldShowFor(directory) {
        return directory && directory.getPath() != '' && directory.getPath() != '/';
    }

    applyTo(directory) {
        if (!this.shouldShowFor(directory)) return;

        new CanvasWindowConfirm(this.window, I18N.get('filemanager.action.directory.delete.title', 'Delete directory'), I18N.get('filemanager.action.directory.delete.question', 'Do you want to delete "%0" and all of its contents?').replace('%0', directory.getName()), () => {
            fetchDynamicJSON('/fileman/delete', { d: directory.getPath(), k: this.window.getKey() }, data => {
                if (data.res == 'ok') {
                    const selectedDirectoryPath = this.window.getSelectedDirectory() ? this.window.getSelectedDirectory().getParentPath() : null;
                    this.window.loadDirectories(selectedDirectoryPath);
                }
            }, error => {
                console.log('Error deleting directory', error);
            });
        });
    }
}
