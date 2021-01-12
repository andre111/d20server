import { CanvasWindowInput } from '../../canvas-window-input.js';
import { DirectoryAction } from './directory-action.js';

export class DirectoryActionCreate extends DirectoryAction {
    constructor(window) {
        super(window, 'Create', null); //TODO: icon
    }

    shouldShowFor(directory) {
        return true;
    }

    applyTo(directory) {
        new CanvasWindowInput('Create directory', 'Enter directory name: ', '', input => {
            if(!input || input.trim() == '') return;

            const URL = '/fileman/createdir';
            $.ajax({
                url: URL,
                type: 'POST',
                data: { d: directory.getPath(), n: input, k: this.window.getKey() },
                dataType: 'json',
                cache: false,
                success: data => {
                    if(data.res == 'ok') {
                        const selectedDirectoryPath = this.window.getSelectedDirectory() ? this.window.getSelectedDirectory().getPath() : null;
                        this.window.loadDirectories(selectedDirectoryPath);
                    }
                },
                error: data => {
                    console.log('Error creating directory', data);
                }
            });
        });
    }
}
