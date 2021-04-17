import { Access, Role } from '../../common/constants.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { ChatEntry } from '../../common/message/chat/chat-entry.js';
import { ChatEntries } from '../../common/messages.js';
import { Commands } from '../command/commands.js';
import { readJson, saveJson } from '../util/fileutil.js';
import { MessageService } from './message-service.js';
import { UserService } from './user-service.js';

const SYSTEM_SOURCE = 0;

var chatData = null;
function getChatData() {
    if(!chatData) {
        chatData = readJson('chat');
        if(!chatData) chatData = { entries: [] };
    }

    return chatData;
}

function sendToClients(append, entries) {
    UserService.forEach(profile => {
        // determine all relevant entries
        var playerEntries = [];
        for(const entry of entries) {
            if(!(entry instanceof ChatEntry)) throw new Error('Can only send instances of ChatEntry');
            if(canRecieve(profile, entry)) {
                playerEntries.push(entry);
            }
        }

        // send message
        MessageService.send(new ChatEntries(playerEntries, append, false), profile);
    });
}

function canRecieve(profile, entry) {
    if(!profile || !entry) return false;
    if(!entry.getRecipents() || entry.getRecipents().length == 0) return true;
    if(entry.doIncludeGMs() && profile.getRole() == Role.GM) return true;

    return entry.getRecipents().includes(profile.getID());
}

export class ChatService {
    static onMessage(profile, message) {
        if(message.startsWith('/')) {
            // extract command name and arguments
            var endIndex = message.indexOf(' ');
            if(endIndex < 0) endIndex = message.length;
            const commandName = message.substring(1, endIndex);
            const commandArgs = message.substring(Math.min(endIndex+1, message.length));
            
            const command = Commands.get(commandName);
            if(command) {
                if(command.requiresGM() && profile.getRole() != Role.GM) {
                    ChatService.appendNote(profile, 'You do not have permission to use this command');
                    return;
                }

                // handle command
                try {
                    command.execute(profile, commandArgs);
                } catch(error) {
                    ChatService.appendNote(profile, `Error in /${commandName}:`, `${error}`);
                }
            } else {
                ChatService.appendNote(profile, `Unknown command: ${commandName}`);
                return;
            }
        } else if(message.startsWith('!')) {
            // extract macro name
            const macroName = message.substring(1);
            
            // find token and check access
            const token = profile.getSelectedToken(true);
            if(!token) {
                ChatService.appendNote(profile, 'No (single) token selected');
                return;
            }
            const accessLevel = token.getAccessLevel(profile);
            if(!Access.matches(token.prop('macroUse').getAccessValue(), accessLevel)) {
                ChatService.appendNote(profile, 'No access to macros on this token');
                return;
            }

            // find macro (!<name> -> custom in token or actor, !!<name> -> predefined)
            var macro = null;
            if(macroName.startsWith('!')) {
                const predefMacros = token.getPredefinedMacros();
                if(predefMacros[macroName.substring(1)]) {
                    macro = predefMacros[macroName.substring(1)].join('\n');
                }

                const actor = EntityManagers.get('actor').find(token.prop('actorID').getLong());
                if(actor) {
                    const actorPredefMacros = actor.getPredefinedMacros();
                    if(actorPredefMacros[macroName.substring(1)]) {
                        macro = actorPredefMacros[macroName.substring(1)].join('\n');
                    }
                }
            } else {
                const actor = EntityManagers.get('actor').find(token.prop('actorID').getLong());
                if(actor) {
                    const actorMacros = actor.prop('macros').getStringMap();
                    macro = actorMacros[macroName];
                }

                const tokenMacros = token.prop('macros').getStringMap();
                if(tokenMacros[macroName]) macro = tokenMacros[macroName];
            }
            if(!macro) {
                ChatService.appendNote(profile, `Could not find macro: ${macroName}`);
                return;
            }

            // execute macro
            const macroLines = macro.split('\n');
            for(const macroLine of macroLines) {
                if(macroLine.trim() == '') continue;

                ChatService.onMessage(profile, macroLine);
            }
        } else {
            // handle simple message
            var text = '<p class="chat-sender">';
            text = text + ChatService.escape(profile.getUsername()) + ': ';
            text = text + '</p>';
            text = text + '<p class="chat-message">';
            text = text + ChatService.escape(message);
            text = text + '</p>';

            ChatService.append(true, new ChatEntry(text, profile.getID()));
        }
    }

    static sendHistory(profile, count) {
		// determine all relevant entries
        var playerEntries = [];
        const start = Math.max(0, getChatData().entries.length - count);
        for(var i=start; i<getChatData().entries.length; i++) {
            if(canRecieve(profile, getChatData().entries[i])) {
                playerEntries.push(getChatData().entries[i]);
            }
        }
        
        // send message
        MessageService.send(new ChatEntries(playerEntries, false, true), profile);
    }

    static appendNote(recipent, ...lines) {
        var text = '<p class="chat-info">';
        for(const line of lines) {
            text = text + ChatService.escape(line) + '<br>';
        }
        text = text + '</p>';

        ChatService.append(false, new ChatEntry(text, SYSTEM_SOURCE, false, recipent ? [recipent.getID()] : []));
    }

    static append(store, ...entries) {
        // store chat entries on server side
        if(store) {
            for(const entry of entries) {
                if(!(entry instanceof ChatEntry)) throw new Error('Can only append instances of ChatEntry');
                getChatData().entries.push(entry);
            }
            saveJson('chat', getChatData());
        }
    
        // send chat entries to clients
        sendToClients(true, entries);
    }
    
    static triggerContent(profile, messageID, contentID) {
        // find entry
        const chatData = getChatData();
        var entry = null;
        for(var i=chatData.entries.length-1; i>=Math.max(0, chatData.entries.length-200); i--) {
            if(chatData.entries[i].getID() == messageID) {
                entry = chatData.entries[i];
                break;
            }
        }

        // check sender
        if(entry.getSource() != profile.getID()) throw new Error('Not original sender');

        // find triggerd content
        var triggeredContent = null;
        if(entry.getTriggeredContent()) {
            for(const triggered of entry.getTriggeredContent()) {
                if(triggered.entry.getID() == contentID) {
                    triggeredContent = triggered;
                    break;
                }
            }
        }
        if(!triggeredContent) throw new Error('Content not found');
        if(triggeredContent.triggered) throw new Error('Already triggered');

        // send trigger
        triggeredContent.triggered = true;
        triggeredContent.entry.resetTime();
        ChatService.append(true, triggeredContent.entry);
    }

    static escape(string) {
        string = string.replace(/&/g, '&amp;');
        string = string.replace(/</g, '&lt;');
        string = string.replace(/>/g, '&gt;');
        string = string.replace(/"/g, '&quot;');
        return string;
    }

    static unescape(string) {
        string = string.replace(/&quot;/g, '"');
        string = string.replace(/&gt;/g, '>');
        string = string.replace(/&lt;/g, '<');
        string = string.replace(/&amp;/g, '&');
        return string;
    }
}
