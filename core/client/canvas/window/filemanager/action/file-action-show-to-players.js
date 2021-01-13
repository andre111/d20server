import { ActionCommand } from '../../../../../common/messages.js';
import { MessageService } from '../../../../service/message-service.js';
import { FileAction } from './file-action.js';

export class FileActionShowToPlayers extends FileAction {
    constructor(window) {
        super(window, 'Show to Players', 9);
    }

    shouldShowFor(file) {
        return file && file.getType() == 'image';
    }

    applyTo(file) {
        MessageService.send(new ActionCommand('SHOW_IMAGE', 0, 0, 0, false, '/data/files'+file.getPath()));
    }
}
