// @ts-check
import { I18N } from '../../../../../common/util/i18n.js';
import { fetchDynamicJSON } from '../../../../util/fetchutil.js';
import { CanvasWindowInput } from '../../canvas-window-input.js';
import { DirectoryAction } from './directory-action.js';

export class DirectoryActionCreate extends DirectoryAction {
    constructor(window) {
        super(window, I18N.get('filemanager.action.directory.create.name', 'Create'), 1);
    }

    shouldShowFor(directory) {
        return true;
    }

    applyTo(directory) {
        new CanvasWindowInput(this.window, I18N.get('filemanager.action.directory.create.title', 'Create directory'), I18N.get('filemanager.action.directory.create.prompt', 'Enter directory name: '), '', input => {
            if (!input || input.trim() == '') return;

            fetchDynamicJSON('/fileman/createdir', { d: directory.getPath(), n: input, k: this.window.getKey() }, data => {
                if (data.res == 'ok') {
                    const selectedDirectoryPath = this.window.getSelectedDirectory() ? this.window.getSelectedDirectory().getPath() : null;
                    this.window.loadDirectories(selectedDirectoryPath);
                }
            }, error => {
                console.log('Error creating directory', error);
            });
        });
    }
}
