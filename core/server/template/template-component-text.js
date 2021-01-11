import { TemplateComponent } from './template-component.js';

export class TemplateComponentText extends TemplateComponent {
    string;

    constructor(string) {
        super();

        this.string = string;
    }

    getString() {
        return this.string;
    }

    getDiceRolls() {
        return [];
    }

    getTriggeredContent() {
        return [];
    }
}
