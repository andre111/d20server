import { Role, Type } from '../../common/constants.js';
import { EntityManagers } from '../../common/entity/entity-managers.js';
import { EntityReference } from '../../common/entity/entity-reference.js';
import { Events } from '../../common/events.js';
import { ChatEntry } from '../../common/message/chat/chat-entry.js';
import { ChatEntries } from '../../common/messages.js';
import { Scripting } from '../../common/scripting/scripting.js';
import { Value } from '../../common/scripting/value.js';
import { TokenUtil } from '../../common/util/tokenutil.js';
import { readJson, saveJson } from '../util/fileutil.js';
import { RollFormatter } from '../util/roll-formatter.js';
import { MessageService } from './message-service.js';
import { UserService } from './user-service.js';

const SYSTEM_SOURCE = 0;
const SCRIPT = new Scripting();

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

// Handle Macros
//TODO: move to more fitting location
Events.on('chatMessage', event => {
    const message = event.data.message;
    const profile = event.data.profile;

    if(message.startsWith('!')) {
        event.cancel();

        // extract macro name
        var macroName = message.substring(1);
        
        // find actor and check access
        var actor = null;
        if(macroName.includes('§')) {
            const entityPath = macroName.substring(macroName.indexOf('§')+1);
            macroName = macroName.substring(0, macroName.indexOf('§'));

            actor = EntityManagers.findEntity(entityPath);
        } else {
            const token = profile.getSelectedToken(true);
            if(!token) {
                ChatService.appendNote(profile, 'No (single) token selected');
                return;
            }
            actor = TokenUtil.getActor(token);
        }
        if(!actor || actor.getType() != 'actor') {
            ChatService.appendNote(profile, 'Could not find actor');
            return;
        }

        // find macro (!<name> -> custom, !!<name> -> predefined)
        var macro = null;
        if(macroName.startsWith('!')) {
            const actorPredefMacros = actor.getPredefinedMacros();
            if(actorPredefMacros[macroName.substring(1)]) {
                macro = actorPredefMacros[macroName.substring(1)].join('\n');
            }
        } else {
            const actorMacros = actor.getStringMap('macros');
            macro = actorMacros[macroName];
        }
        if(!macro) {
            ChatService.appendNote(profile, `Could not find macro: ${macroName}`);
            return;
        }

        // execute macro
        SCRIPT.pushVariable('sActor', new Value(new EntityReference(actor), Type.ENTITY, ''));
        const scriptMarker = '?SCRIPT?\n';
        if(macro.startsWith(scriptMarker)) {
            SCRIPT.interpret(macro.substring('?SCRIPT?\n'.length), profile, null);
            if(SCRIPT.errors.length != 0) {
                ChatService.appendError(profile, SCRIPT.errors.join('\n'));
            }
        } else {
            const macroLines = macro.split('\n');
            for(const macroLine of macroLines) {
                if(macroLine.trim() == '') continue;

                ChatService.onMessage(profile, macroLine);
            }
        }
        SCRIPT.popVariable('sActor');
    }
});

export class ChatService {
    static onMessage(profile, message) {
        const event = Events.trigger('chatMessage', { message: message, profile: profile }, true);
        if(event.canceled) return;

        // handle simple message
        try {
            const parsed = ChatService.parseInlineExpressions(message, profile);

            var text = '<div class="chat-sender">';
            text = text + ChatService.escape(profile.getUsername()) + ': ';
            text = text + '</div>';
            text = text + '<div class="chat-message">';
            text = text + parsed.string;
            text = text + '</div>';

            const entry = new ChatEntry(text, profile.getID());
            entry.setRolls(parsed.diceRolls);
            entry.setTriggeredContent(parsed.triggeredContent);

            ChatService.append(true, entry);
        } catch(error) {
            ChatService.appendError(profile, `Error:`, `${error}`);
            console.log(error);
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
        var text = '<div class="chat-info">';
        for(const line of lines) {
            text = text + ChatService.escape(line)+ '<br>';
        }
        text = text + '</div>';

        ChatService.append(false, new ChatEntry(text, SYSTEM_SOURCE, false, recipent ? [recipent.getID()] : []));
    }

    static appendError(recipent, ...lines) {
        var text = '<div class="chat-error">';
        for(const line of lines) {
            text = text + ChatService.escape(line)+ '<br>';
        }
        text = text + '</div>';

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

    static parseInlineExpressions(text, profile) {
        var string = '';
        const diceRolls = [];
        const triggeredContent = [];

        var startIndex = 0;
        while(startIndex < text.length) {
            const inlineStartIndex = text.indexOf('|', startIndex);
            const nextIsInlineRoll = inlineStartIndex != -1;

            if(nextIsInlineRoll) {
                // add remaing text
                string += '<span class="chat-text">'+ChatService.escape(text.substring(startIndex, inlineStartIndex))+"</span>";
                startIndex = inlineStartIndex;

                // find end
                var endIndex = text.indexOf('|', startIndex+1);
                if(endIndex == -1) throw new Error(`Unclosed inline expression at ${startIndex}`);

                // extract expression string
                var exprStr = text.substring(startIndex+1, endIndex);
                var triggered = false;
                if(exprStr.startsWith('?')) { triggered = true; exprStr = exprStr.substring(1); }
                startIndex = endIndex + 1;
                
                // parse expression
                const result = SCRIPT.interpretExpression(ChatService.unescape(exprStr), profile, null);
                const resultDiceRolls = SCRIPT.diceRolls;
                var error = null;
                if(SCRIPT.errors.length != 0) {
                    error = SCRIPT.errors.join('\n');
                    console.log(error);
                }

                // create resultString
                var resultString = '';
                var triggerText = 'Roll';
                if(result) {
                    switch(result.type) {
                    case Type.DOUBLE:
                        resultString = RollFormatter.formatInlineDiceRoll(exprStr, result, resultDiceRolls, error);
                        break;
                    case Type.STRING:
                        resultString = result.value;
                        triggerText = 'Show';
                        break;
                    default:
                        resultString = 'Error: Unsupported type - '+result.type;
                        break;
                    }
                } else {
                    resultString = RollFormatter.formatInlineDiceRoll(exprStr, null, [], error);
                }

                // append rolls or trigger button
                if(triggered) {
                    const entry = new ChatEntry(resultString, profile.getID());
                    entry.setRolls(resultDiceRolls);
                    triggeredContent.push({
                        entry: entry,
                        parent: null,
                        triggerd: false
                    });
                    string += `<span id="${entry.getID()}" class="chat-dice-inline chat-button replaceable">${triggerText}</span>`;
                } else {
                    for(const diceRoll of resultDiceRolls) {
                        diceRolls.push(diceRoll);
                    }
                    string += resultString;
                }
            } else {
                string += '<span class="chat-text">'+ChatService.escape(text.substring(startIndex, text.length))+"</span>";
                startIndex = text.length;
            }
        }

        return { string: string, diceRolls: diceRolls, triggeredContent: triggeredContent };
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
