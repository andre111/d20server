import path from 'path';
import { readFileSync } from 'fs';

import { Template } from './template.js';
import { TemplateComponentPlaceholder } from './template-component-placeholder.js';
import { TemplateComponentText } from './template-component-text.js';
import { Placeholders } from './placeholders.js';

const TEMPLATES = new Map();
export class Templates {
    static get(name) {
        return TEMPLATES.get(name);
    }

    static set(name, template) {
        if(!(template instanceof Template)) throw new Error('Can only set instances of Template');
        TEMPLATES.set(name, template);
    }
}

function parseTemplate(string, values) {
    var components = [];

    // replace 'preset placeholder'
    for(var i=0; i<values.length; i++) {
        string = string.replace('$'+i, values[i]);
    }
    if(string.includes('$')) throw new Error('Unfilled $ value in Template');
    
    // find normal text and "dynamic placeholder" parts
    var startIndex = 0;
    var currentIndex = 0;
    var inPlaceholder = false;

    while(currentIndex < string.length) {
        if(string.charAt(currentIndex) == '%') {
            const part = string.substring(startIndex, currentIndex);

            if(inPlaceholder) {
                if(part == '%') {
                    components.push(new TemplateComponentText('%'));
                } else {
                    const splitPart = part.substring(1).split(':');
                    components.push(new TemplateComponentPlaceholder(Number(splitPart[0]), Placeholders.get(splitPart[1])));
                }
                inPlaceholder = false;
                startIndex = currentIndex+1;
            } else {
                components.push(new TemplateComponentText(part));
                inPlaceholder = true;
                startIndex = currentIndex;
            }
        }
        currentIndex++;
    }

    // add remaining part
    const part = string.substring(startIndex, currentIndex);
    components.push(new TemplateComponentText(part));

    return new Template(components);
}

function loadTemplate(name, ...values) {
    const file = path.join(path.resolve(), '/src/main/resources/templates/'+name+'_html.txt');
    return parseTemplate(String(readFileSync(file)), values);
}

Templates.set('attack0', loadTemplate('attack0', '#888888'));
Templates.set('attack1', loadTemplate('attack1', '#888888'));
Templates.set('attack11', loadTemplate('attack11', '#888888'));
Templates.set('attack21', loadTemplate('attack21', '#888888'));
Templates.set('attack22s', loadTemplate('attack22s', '#888888'));
Templates.set('attack2s2s', loadTemplate('attack2s2s', '#888888'));

Templates.set('magic0', loadTemplate('attack0', '#57007F'));
Templates.set('magic1', loadTemplate('attack1', '#57007F'));
Templates.set('magic11', loadTemplate('attack11', '#57007F'));
Templates.set('magic21', loadTemplate('attack21', '#57007F'));
Templates.set('magic22s', loadTemplate('attack22s', '#57007F'));
Templates.set('magic2s2s', loadTemplate('attack2s2s', '#57007F'));

Templates.set('generic0', loadTemplate('attack0', '#4A7C00'));
Templates.set('generic1', loadTemplate('attack1', '#4A7C00'));
Templates.set('generic11', loadTemplate('attack11', '#4A7C00'));
Templates.set('generic21', loadTemplate('attack21', '#4A7C00'));
Templates.set('generic22s', loadTemplate('attack22s', '#4A7C00'));
Templates.set('generic2s2s', loadTemplate('attack2s2s', '#4A7C00'));

Templates.set('text', loadTemplate('text'));

Templates.set('button', loadTemplate('button'));
