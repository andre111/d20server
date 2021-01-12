import { CanvasWindowInput } from '../../canvas-window-input.js';
import { FileAction } from './file-action.js';

export class FileActionRename extends FileAction {
    constructor(window) {
        super(window, 'Rename', null); //TODO: icon
    }

    shouldShowFor(file) {
        return true;
    }

    applyTo(file) {
        new CanvasWindowInput('Rename file', 'Enter new file name: ', file.getName(), input => {
            if(!input || input.trim() == '') return;

            const URL = '/fileman/rename';
            $.ajax({
                url: URL,
                type: 'POST',
                data: { f: file.getPath(), n: input, k: this.window.getKey() },
                dataType: 'json',
                cache: false,
                success: data => {
                    if(data.res == 'ok') {
                        var path = file.getDirectory().getPath();
                        if(path.charAt(path.length-1) != '/') path = path + '/';

                        file.setPath(path + input);
                        file.reloadElement();
                        //TODO: notify window to update order / search?
                    }
                },
                error: data => {
                    console.log('Error renaming file', data);
                }
            });
        });
    }
}
