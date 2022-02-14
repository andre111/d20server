import { TemplateComponent } from './template-component.js';

export class TemplateComponentPlaceholder extends TemplateComponent {
    index;
    placeholder;

    string = null;
    diceRolls = null;
    triggeredContent = null;

    constructor(index, placeholder) {
        super();

        this.index = index;
        this.placeholder = placeholder;
    }

    getIndex() {
        return this.index;
    }

    parse(profile, input) {
        this.diceRolls = [];
        this.triggeredContent = [];
        this.string = this.placeholder.parse(profile, input, this.diceRolls, this.triggeredContent);
    }

    getString() {
        if (this.string == null) throw new Error('Placeholder was not parsed before getting string');
        const currentString = this.string;
        this.string = null;
        return currentString;
    }

    getDiceRolls() {
        if (this.diceRolls == null) throw new Error('Placeholder was not parsed before getting dice rolls');
        const currentDiceRolls = this.diceRolls;
        this.diceRolls = null;
        return currentDiceRolls;
    }

    getTriggeredContent() {
        if (this.triggeredContent == null) throw new Error('Placeholder was not parsed before getting triggered content');
        const currentTriggeredContent = this.triggeredContent;
        this.triggeredContent = null;
        return currentTriggeredContent;
    }
}
