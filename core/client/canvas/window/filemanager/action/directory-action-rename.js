import { I18N } from '../../../../../common/util/i18n.js';
import { fetchDynamicJSON } from '../../../../util/fetchutil.js';
import { CanvasWindowInput } from '../../canvas-window-input.js';
import { DirectoryAction } from './directory-action.js';

export class DirectoryActionRename extends DirectoryAction {
    constructor(window) {
        super(window, I18N.get('filemanager.action.directory.rename.name', 'Rename'), 3);
    }

    shouldShowFor(directory) {
        return directory && directory.getPath() != '' && directory.getPath() != '/';
    }

    applyTo(directory) {
        if(!this.shouldShowFor(directory)) return;
        
        new CanvasWindowInput(this.window, I18N.get('filemanager.action.directory.rename.title', 'Rename directory'), I18N.get('filemanager.action.directory.rename.prompt', 'Enter new directory name: '), directory.getName(), input => {
            if(!input || input.trim() == '') return;

            fetchDynamicJSON('/fileman/rename', { d: directory.getPath(), n: input, k: this.window.getKey() }, data => {
                if(data.res == 'ok') {
                    const selectedDirectoryPath = null; //TODO: determine new path of the directory
                    this.window.loadDirectories(selectedDirectoryPath);
                }
            }, error => {
                console.log('Error renaming directory', error);
            });
        });
    }
}
