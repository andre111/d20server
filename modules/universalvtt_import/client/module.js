// @ts-check
import { Events } from '../../../core/common/events.js';
import { FILE_TYPE_UVTT } from '../common/module.js';
import { CanvasWindowUVTTImport } from './canvas/window/canvas-window-uvttimport.js';

Events.on('fileManagerSelect', event => {
    if (event.data.file.getType() == FILE_TYPE_UVTT) {
        new CanvasWindowUVTTImport(event.data.manager, event.data.file.getPath(), event.data.file.getName().replace('.dd2vtt', ''));
        event.cancel();
    }
});
