//TODO: implement chat history
class SidepanelTabChat extends SidepanelTab {
    constructor() {
        super("Chat", "chat", true);
        
        // create html elements
        this.tab.style.display = "grid";
        this.tab.style.gridTemplateRows = "auto max-content";
        
        this.chatPanel = document.createElement("div");
        this.chatPanel.style.overflow = "auto";
        this.tab.appendChild(this.chatPanel);
        
        var inputPanel = document.createElement("div");
        this.input = document.createElement("input");
        this.input.type = "text";
        this.input.style.width = "300px";
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
                        this.input.value = "";
                        this.input.selectionStart = this.input.selectionEnd = this.input.value.length;
                    }
                }
            }
        };
        inputPanel.appendChild(this.input);
        var send = GuiUtils.createButton(inputPanel, "Send", () => this.doSend());
        send.style.width = "64px";
        this.tab.appendChild(inputPanel);
        
        // values
        this.toggle = false;
        this.previousMessages = [];
        this.previousMessageIndex = -1;
        this.MESSAGE_HISTORY_SIZE = 20;
        
        // load previous messages
        var prev = localStorage.getItem("previous_chat_messages");
        if(prev) {
            this.previousMessages = JSON.parse(prev);
        }
    }
    
    clear() {
        this.chatPanel.innerHTML = "";
    }
    
    append(entry) {
        var container = document.createElement("div");
        container.style.backgroundColor = this.toggle ? "#feeebd" : "#e2cf9d";
        container.style.width = "100%";
        container.style.maxWidth = "100%";
        
        container.innerHTML = entry.text;
        GuiUtils.makeHoverable(container);
        
        this.chatPanel.appendChild(container);
        //container.scrollIntoView(); // this "breaks" the website by offseting it up by a few pixels for some reason, using "outdated" code below as an alternative
        this.chatPanel.scrollTop = this.chatPanel.scrollHeight;
        
        this.toggle = !this.toggle;
    }
    
    doSend() {
        var text = this.input.value;
        if(text) {
            var msg = {
                msg: "SendChatMessage",
                message: ""+text
            };
            MessageService.send(msg);
            this.storePreviousMessages(text);
            this.input.value = "";
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
        
        localStorage.setItem("previous_chat_messages", JSON.stringify(this.previousMessages));
    }
}
