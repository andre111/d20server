import { I18N } from '../../../../../common/util/i18n.js';
import { CanvasWindowConfirm } from '../../canvas-window-confirm.js';
import { FileAction } from './file-action.js';

export class FileActionDelete extends FileAction {
    constructor(window) {
        super(window, I18N.get('filemanager.action.file.delete.name', 'Delete'), 7);
    }

    shouldShowFor(file) {
        return true;
    }

    applyTo(file) {
        new CanvasWindowConfirm(this.window, I18N.get('filemanager.action.file.delete.title', 'Delete file'), I18N.get('filemanager.action.file.delete.question', 'Do you want to delete "%0"?').replace('%0', file.getName()), () => {
            const URL = '/fileman/delete';
            $.ajax({
                url: URL,
                type: 'POST',
                data: { f: file.getPath(), k: this.window.getKey() },
                dataType: 'json',
                cache: false,
                success: data => {
                    if(data.res == 'ok') {
                        const dir = file.getDirectory();
                        const index = dir.getFiles().indexOf(file);
                        if(index >= 0) dir.setFiles(dir.getFiles().slice(index, 1));

                        dir.setSelectedFile(null);
                        file.getElement().parentElement.removeChild(file.getElement());
                        if(this.window.getSelectedFile() == file) this.window.selectFile(null);
                    }
                },
                error: data => {
                    console.log('Error renaming file', data);
                }
            });
        });
    }
}
