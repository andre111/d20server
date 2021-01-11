import { ID } from '../../entity/id.js';
import { registerType } from '../../util/datautil.js';

export class ChatEntry {
    id;
    text;
    time;

    replaceParent;

    recipents;
    includeGMs;
    source;

    rolls;
    triggeredContent;

    constructor(text, source, includeGMs, recipents) {
        if(text) {
            this.id = ID.next();
            this.text = text;
            this.resetTime();
            
            this.recipents = recipents;
            this.includeGMs = includeGMs || false;
            this.source = source;
        }
    }

    // getters
    getID() {
        return this.id;
    }

    getText() {
        return this.text;
    }

    getTime() {
        return this.time;
    }

    getReplaceParent() {
        return this.replaceParent;
    }

    getRecipents() {
        return this.recipents;
    }

    doIncludeGMs() {
        return this.includeGMs;
    }

    getSource() {
        return this.source;
    }

	// special set methods for rolls and triggered data
    getRolls() {
        return this.rolls;
    }

    setRolls(rolls) {
        this.rolls = rolls;
    }

    getTriggeredContent() {
        return this.triggeredContent;
    }

    setTriggeredContent(triggeredContent) {
        for(const tc of triggeredContent) {
			// make entry an actual replace order, instead of normal entry
            tc.parent = this.getID();
            tc.entry.replaceParent = this.getID();
			// transfer important values from parent
            tc.entry.recipents = this.recipents;
            tc.entry.includeGMs = this.includeGMs;
        }

        this.triggeredContent = triggeredContent;
    }

    resetTime() {
        this.time = Math.trunc(new Date().getTime()/1000);
    }
}
registerType(ChatEntry);
