import { SidepanelTab } from './sidepanel-tab.js';
import { GuiUtils } from '../util/guiutil.js';
import { MessageService } from '../service/message-service.js';

import { SendChatMessage } from '../../common/messages.js';
import { Events } from '../../common/events.js';

export class SidepanelTabChat extends SidepanelTab {
    constructor() {
        super('Chat', true);
        
        // create html elements
        this.tab.style.display = 'grid';
        this.tab.style.gridTemplateRows = 'auto max-content';
        
        this.chatPanel = document.createElement('div');
        this.chatPanel.style.overflow = 'auto';
        this.tab.appendChild(this.chatPanel);
        
        var inputPanel = document.createElement('div');
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.style.width = '80%';
        this.input.onkeyup = e => {
            if(e.keyCode == 13) {
                this.doSend();
            } else if(e.keyCode == 38) {
                // navigate up through previous messages
                if(!this.input.value) {
                    if(this.previousMessages.length > 0) {
                        this.previousMessageIndex = this.previousMessages.length-1;
                        this.input.value = this.previousMessages[this.previousMessageIndex];
                        this.input.selectionStart = this.input.selectionEnd = this.input.value.length;
                    }
                } else if(this.previousMessageIndex != -1 && this.input.value == this.previousMessages[this.previousMessageIndex]) {
                    if(this.previousMessageIndex > 0) {
                        this.previousMessageIndex--;
                        this.input.value = this.previousMessages[this.previousMessageIndex];
                        this.input.selectionStart = this.input.selectionEnd = this.input.value.length;
                    }
                }
            } else if(e.keyCode == 40) {
                // navigate down through previous messages
                if(this.previousMessageIndex != -1 && this.input.value == this.previousMessages[this.previousMessageIndex]) {
                    if(this.previousMessageIndex < this.previousMessages.length-1) {
                        this.previousMessageIndex++;
                        this.input.value = this.previousMessages[this.previousMessageIndex];
                        this.input.selectionStart = this.input.selectionEnd = this.input.value.length;
                    } else {
                        this.previousMessageIndex = -1;
                        this.input.value = '';
                        this.input.selectionStart = this.input.selectionEnd = this.input.value.length;
                    }
                }
            }
        };
        inputPanel.appendChild(this.input);
        var send = GuiUtils.createButton(inputPanel, 'Send', () => this.doSend());
        send.style.width = '20%';
        this.tab.appendChild(inputPanel);
        
        // storage (for accessing and modifying past messages)
        this.entries = new Map();
        
        // values
        this.previousMessages = [];
        this.previousMessageIndex = -1;
        this.MESSAGE_HISTORY_SIZE = 20;
        
        // load previous messages
        var prev = localStorage.getItem('previous_chat_messages');
        if(prev) {
            this.previousMessages = JSON.parse(prev);
        }
    }
    
    clear() {
        this.chatPanel.innerHTML = '';
    }
    
    add(entry) {
        if(entry.getReplaceParent() && entry.getReplaceParent() > 0) {
            // find replace parent
            if(!this.entries.has(entry.getReplaceParent())) { console.log('Ignoring replace with unknown parent'); return; }
            var container = this.entries.get(entry.getReplaceParent());
            
            // find replaceable object and replace content
            $(container).find('#'+entry.getID()+'.replaceable').replaceWith(entry.getText());
            GuiUtils.makeHoverable(container);
        } else {
            // create container
            var container = document.createElement('div');
            container.className = 'chat';
            
            container.innerHTML = entry.getText();
            
            // add replaceable trigger
            for(const element of $(container).find('.replaceable')) {
                element.onclick = () => {
                    const msg = new SendChatMessage('/trigger '+entry.getID()+' '+element.id);
                    MessageService.send(msg);
                };
            }
            
            // add timestamp (with hover and auto update)
            var timestampP = document.createElement('p');
            timestampP.className = 'chat-timestamp hoverable';
            container.appendChild(timestampP);
            var timestampText = document.createElement('p');
            timestampP.appendChild(timestampText);
            var timestampHover = document.createElement('p');
            timestampHover.className = 'onhover';
            timestampP.appendChild(timestampHover);
            
            timestampText.innerHTML = dayjs.unix(entry.getTime()).fromNow();
            timestampHover.innerHTML = dayjs.unix(entry.getTime()).format('lll');
            this.scheduleUpdate(timestampText, entry);
            
            // make gui adjustments
            GuiUtils.makeHoverable(container);
            
            // add to map
            this.entries.set(entry.getID(), container);
            
            // append to gui
            //TODO: maybe? find location (could be older message that was kept hidden for some time -> should now appear before other messages?)
            this.chatPanel.appendChild(container);
            //container.scrollIntoView(); // this 'breaks' the website by offseting it up by a few pixels for some reason, using 'outdated' code below as an alternative
            this.chatPanel.scrollTop = this.chatPanel.scrollHeight;
        }
    }
    
    scheduleUpdate(timestampText, entry) {
        // determine wait time (a second when below a minute ago, a minute when below one hour, one hour otherwise)
        var ago = dayjs.duration(dayjs().diff(dayjs.unix(entry.getTime()))).as('seconds');
        var time = (ago < 60 ? 1 : (ago < 60*60 ? 60 : 60 * 60)) * 1000;
        
        setTimeout(() => {
            // perform update
            timestampText.innerHTML = dayjs.unix(entry.getTime()).fromNow();
            
            // schedule next update
            this.scheduleUpdate(timestampText, entry);
        }, time);
    }
    
    onMessage(entry, historical) {
        var evt = {
            entry: entry,
            historical: historical,
            canceled: false
        };
        Events.trigger('chatMessage', evt);
        if(evt.canceled) return;
        
        this.add(entry);
    }
    
    doSend() {
        var text = this.input.value;
        if(text) {
            const msg = new SendChatMessage(String(text));
            MessageService.send(msg);
            this.storePreviousMessages(text);
            this.input.value = '';
        }
    }
    
    storePreviousMessages(message) {
        // remember as previous message and reset
		if(this.previousMessages.length == 0 || message != this.previousMessages[this.previousMessages.length-1]) {
            var index = this.previousMessages.indexOf(message);
			if(index > -1) this.previousMessages.splice(index, 1); // only keep latest occurence?
			this.previousMessages.push(message);
		}
		while(this.previousMessages.length > this.MESSAGE_HISTORY_SIZE) {
			this.previousMessages.shift();
		}
		this.previousMessageIndex = -1;
        
        localStorage.setItem('previous_chat_messages', JSON.stringify(this.previousMessages));
    }
}