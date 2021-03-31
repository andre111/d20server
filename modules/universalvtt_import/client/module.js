import { Events } from '../../../core/common/events.js';
import { FILE_TYPE_UVTT } from '../common/module.js';
import { CanvasWindowUVTTImport } from './canvas/window/canvas-window-uvttimport.js';

Events.on('fileManagerSelect', event => {
    if(event.canceled) return;

    if(event.file.getType() == FILE_TYPE_UVTT) {
        new CanvasWindowUVTTImport(event.file.getPath());
        event.canceled = true;
    }
});
