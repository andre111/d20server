import { I18N } from '../../../../../common/util/i18n.js';
import { fetchDynamicJSON } from '../../../../util/fetchutil.js';
import { CanvasWindowInput } from '../../canvas-window-input.js';
import { FileAction } from './file-action.js';

export class FileActionRename extends FileAction {
    constructor(window) {
        super(window, I18N.get('filemanager.action.file.rename.name', 'Rename'), 6);
    }

    shouldShowFor(file) {
        return true;
    }

    applyTo(file) {
        new CanvasWindowInput(this.window, I18N.get('filemanager.action.file.rename.title', 'Rename file'), I18N.get('filemanager.action.file.rename.prompt', 'Enter new file name: '), file.getName(), input => {
            if(!input || input.trim() == '') return;

            fetchDynamicJSON('/fileman/rename', { f: file.getPath(), n: input, k: this.window.getKey() }, data => {
                if(data.res == 'ok') {
                    var path = file.getDirectory().getPath();
                    if(path.charAt(path.length-1) != '/') path = path + '/';

                    file.setPath(path + input);
                    file.reloadElement();
                    //TODO: notify window to update order / search?
                }
            }, error => {
                console.log('Error renaming file', error);
            });
        });
    }
}
