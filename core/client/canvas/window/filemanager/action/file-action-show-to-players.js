// @ts-check
import { ActionCommand } from '../../../../../common/messages.js';
import { FILE_TYPE_IMAGE } from '../../../../../common/util/datautil.js';
import { I18N } from '../../../../../common/util/i18n.js';
import { MessageService } from '../../../../service/message-service.js';
import { FileAction } from './file-action.js';

export class FileActionShowToPlayers extends FileAction {
    constructor(window) {
        super(window, I18N.get('filemanager.action.file.showtoplayers', 'Show to Players'), 9);
    }

    shouldShowFor(file) {
        return file && file.getType() == FILE_TYPE_IMAGE;
    }

    applyTo(file) {
        MessageService.send(new ActionCommand('SHOW_IMAGE', 0, 0, 0, false, '/data/files' + file.getPath()));
    }
}
