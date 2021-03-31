import { Events } from '../../../core/common/events.js';
import { Commands } from '../../../core/server/command/commands.js';
import { UVTTImportCommand } from './command/uvtt-import-command.js';

Events.on('serverInit', () => {
    Commands.register(new UVTTImportCommand('uvttimport', []));
});
