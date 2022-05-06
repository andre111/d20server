// @ts-check
import { Events } from "../../../core/common/events.js";
import { Commands } from "../../../core/server/command/commands.js";
import { PFUseCommand } from "./command/pf-use-command.js";

Events.on('serverInit', event => {
    // register use command
    Commands.register(new PFUseCommand('pf_use', []));
});
