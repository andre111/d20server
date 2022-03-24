// @ts-check
import { TemplateComponentPlaceholder } from './template-component-placeholder.js';

export class Template {
    components;

    constructor(components) {
        this.components = components;
    }

    parse(profile, inputs) {
        // parse arguments
        for (const component of this.components) {
            if (component instanceof TemplateComponentPlaceholder) {
                const currentInput = component.getIndex();
                if (currentInput >= inputs.length) throw new Error('Too little arguments for placeholder');
                component.parse(profile, inputs[currentInput]);
            }
        }

        // build string
        var string = '';
        for (const component of this.components) {
            string = string + component.getString();
        }

        // collect rolls
        var diceRolls = [];
        for (const component of this.components) {
            diceRolls = diceRolls.concat(component.getDiceRolls());
        }

        // collect triggered content
        var triggeredContent = [];
        for (const component of this.components) {
            triggeredContent = triggeredContent.concat(component.getTriggeredContent());
        }

        return { string: string, diceRolls: diceRolls, triggeredContent: triggeredContent };
    }
}
