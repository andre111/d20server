import { CanvasWindowConfirm } from '../../canvas-window-confirm.js';
import { FileAction } from './file-action.js';

export class FileActionDelete extends FileAction {
    constructor(window) {
        super(window, 'Delete', null); //TODO: icon
    }

    shouldShowFor(file) {
        return true;
    }

    applyTo(file) {
        new CanvasWindowConfirm('Delete file', 'Do you want to delete "'+file.getName()+'"?', () => {
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
                        const index = dir.getFiles().indexOf(this);
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
