import { DirectoryAction } from './directory-action.js';
import { CanvasWindowConfirm } from '../../canvas-window-confirm.js';

export class DirectoryActionDelete extends DirectoryAction {
    constructor(window) {
        super(window, 'Delete', 2);
    }

    shouldShowFor(directory) {
        return directory && directory.getPath() != '' && directory.getPath() != '/';
    }

    applyTo(directory) {
        if(!this.shouldShowFor(directory)) return;

        new CanvasWindowConfirm('Delete directory', 'Do you want to delete "'+directory.getName()+'" and all of its contents?', () => {
            const URL = '/fileman/delete';
            $.ajax({
                url: URL,
                type: 'POST',
                data: { d: directory.getPath(), k: this.window.getKey() },
                dataType: 'json',
                cache: false,
                success: data => {
                    if(data.res == 'ok') {
                        const selectedDirectoryPath = this.window.getSelectedDirectory() ? this.window.getSelectedDirectory().getParentPath() : null;
                        this.window.loadDirectories(selectedDirectoryPath);
                    }
                },
                error: data => {
                    console.log('Error deleting directory', data);
                }
            });
        });
    }
}
