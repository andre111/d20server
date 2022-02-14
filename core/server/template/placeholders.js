import { PlaceholderRollInlineTriggered } from './placeholder-roll-inline-triggered.js';
import { PlaceholderRollInline } from './placeholder-roll-inline.js';
import { PlaceholderText } from './placeholder-text.js';

const PLACEHOLDERS = new Map();
PLACEHOLDERS.set('text', new PlaceholderText());
PLACEHOLDERS.set('roll-inline', new PlaceholderRollInline());
PLACEHOLDERS.set('roll-inline-triggered', new PlaceholderRollInlineTriggered());

export class Placeholders {
    static get(name) {
        if (!PLACEHOLDERS.has(name)) throw new Error(`Unknown placeholder: ${name}`);
        return PLACEHOLDERS.get(name);
    }
}
