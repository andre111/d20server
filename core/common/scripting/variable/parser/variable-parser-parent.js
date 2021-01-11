import { VariableParser } from './variable-parser.js';

export class VariableParserParent extends VariableParser {
    children = {};

    constructor() {
        super();
    }

    addChild(name, child) {
        if(!(child instanceof VariableParser)) throw new Error('Can only add instances of VariableParser');
        this.children[name] = child;
        return this;
    }

    parse(context, fullName, name) {
        const childName = this.getChildParserName(name);
        const child = this.children[childName];
        if(!child) throw new Error(`Unknown variable ${fullName}, no child with name ${childName}`);

        this.updateContext(context, name);

        return child.parse(context, fullName, this.getChildString(name));
    }

    updateContext(context, name) {
    }

    // default implementation for basic parents '<childName>.<childString>'
    getChildParserName(name) {
        const split = name.split('.');
        return split[0];
    }

    getChildString(name) {
        const split = name.split('.');
        return split.length >= 2 ? split.slice(1).join('.') : '';
    }
}
