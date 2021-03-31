import { FileAction } from './file-action.js';
import { Client } from '../../../../app.js';
import { StateMain } from '../../../../state/state-main.js';
import { CanvasModeEntities } from '../../../mode/canvas-mode-entities.js';

import { Entity } from '../../../../../common/common.js';
import { FILE_TYPE_IMAGE } from '../../../../../common/util/datautil.js';

export class FileActionCreateToken extends FileAction {
    constructor(window) {
        super(window, 'Create Token', 8);
    }

    shouldShowFor(file) {
        return file && file.getType() == FILE_TYPE_IMAGE;
    }

    applyTo(file) {
        if(Client.getState() instanceof StateMain && Client.getState().getMode() instanceof CanvasModeEntities && Client.getState().getMode().entityType == 'token') {
            const token = new Entity('token');
            token.prop('imagePath').setString(file.getPath());
            Client.getState().getMode().setAddEntityAction(token);
            this.window.close();
        }
    }
}
