import { CanvasWindowInput } from '../../canvas-window-input.js';
import { DirectoryAction } from './directory-action.js';

export class DirectoryActionRename extends DirectoryAction {
    constructor(window) {
        super(window, 'Rename', null); //TODO: icon
    }

    shouldShowFor(directory) {
        return directory && directory.getPath() != '' && directory.getPath() != '/';
    }

    applyTo(directory) {
        if(!this.shouldShowFor(directory)) return;
        
        new CanvasWindowInput('Rename directory', 'Enter new directory name: ', directory.getName(), input => {
            if(!input || input.trim() == '') return;

            const URL = '/fileman/rename';
            $.ajax({
                url: URL,
                type: 'POST',
                data: { d: directory.getPath(), n: input, k: this.window.getKey() },
                dataType: 'json',
                cache: false,
                success: data => {
                    if(data.res == 'ok') {
                        const selectedDirectoryPath = null; //TODO: determine new path of the directory
                        this.window.loadDirectories(selectedDirectoryPath);
                    }
                },
                error: data => {
                    console.log('Error renaming directory', data);
                }
            });
        });
    }
}
