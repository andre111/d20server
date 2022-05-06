import { Entity } from '../core/common/common.js';
import { prettyTextToHTML } from './formatter.js';
import { getCombinedString, getStringWithNotes } from './generator-utils.js';

import fs from 'fs-extra';

//TODO: automatically create macro (including clickable name, time, components, ..., button for save (calls default macro) if applicable, button for sr if applicable, button for "damage/whatever" roll if defined, )
// ^should this be a premade macro (and then editable by text) or probably BETTER generated on the fly instead (will need more sepparated properties in addition to the text description)
export function createSpell(entry, zauberIcons) {
    //... get basic info
    const name = entry['Name'];
    const descShort = entry['Beschreibung'];

    // notify of some errors
    const imagePath = zauberIcons[name];
    if (imagePath && !fs.existsSync('./generated/files/image/' + imagePath)) throw new Error(`Zauber ${name} has broken image path: ${imagePath}`);

    // build full description
    var descFull = '';
    {
        descFull += '<p>';
        descFull += prettyTextToHTML(entry['VolleBeschreibung']);
        descFull += '</p>';

        descFull += '<p>';
        descFull += `${entry['Regelwerk']} - Seite ${entry['Seite']}`;
        descFull += '</p>';
    }

    // build search tags
    //TODO: convert to a "set" that can be added to by other code (so when already iterating some stuff) that is finally joined to a single string here
    //TODO: tags should probably be a string list/array, needs support in core, also for editing them
    var tags = '';
    tags = appendGradTags(tags, entry['Grad']);
    tags += `schule:${entry['Schule'].toLowerCase()}\n`;
    for (const us of entry['Unterschule']) {
        tags += `unterschule:${us.toLowerCase()}\n`;
    }
    for (const kat of entry['Kategorie']) {
        tags += `kategorie:${kat.toLowerCase()}\n`;
    }

    // generate attachment entity
    console.log(`Generating Zauber: ${name}`);
    const attachment = new Entity('attachment');
    attachment.setString('type', 'pf_spell_de');
    attachment.setString('name', name.replace(/\//, '\\'));
    attachment.setString('path', 'Zauber/');
    if (imagePath) attachment.setString('imagePath', '/image/' + imagePath);
    attachment.setString('descShort', descShort);
    attachment.setString('descFull', descFull);
    attachment.setString('tags', tags);

    // set pf_spell_de specific values
    attachment.setString('pf_school', createSchoolString(entry));
    attachment.setString('pf_level', createGradString(entry));
    attachment.setString('pf_castingTime', createCastingTimeString(entry));
    attachment.setString('pf_components', createComponentsString(entry));
    if (entry['Reichweite']) attachment.setString('pf_range', entry['Reichweite']);
    if (entry['Ziel']) attachment.setString('pf_target', entry['Ziel']);
    if (entry['Effekt']) attachment.setString('pf_effect', entry['Effekt']);
    if (entry['Wirkungsbereich']) attachment.setString('pf_area', entry['Wirkungsbereich']);
    if (entry['Wirkungsdauer']) attachment.setString('pf_duration', entry['Wirkungsdauer']);
    if (entry['Rettungswurf']) attachment.setString('pf_save', createSaveString(entry));
    if (entry['Zauberresistenz']) attachment.setString('pf_sr', createSRString(entry));

    // generate macro
    var throws = '';
    if (entry['Rettungswurf']) {
        for (const save of entry['Rettungswurf']) {
            const index = knownSaves.indexOf(save['Art']);
            if (index != -1) {
                if (throws != '') throws += ';';
                throws += knownSaves[index] + ' Rettungswurf;' + knownSaveMacros[index];
            }
        }
    }
    if (entry['Wuerfe']) {
        for (const t of entry['Wuerfe']) {
            // adjust expression
            var expr = t['Formel'] ?? '';
            expr = expr.replace(/W/g, 'd');
            for (const key of Object.keys(throwVariables)) {
                expr = expr.replace(new RegExp(key, 'g'), throwVariables[key]);
            }
            switch (t['Art']) {
                case 'Nahkampfangriff':
                    expr = '1d20 + sActor.pf_baseAttackBonus + sActor.pf_strMod + sActor.modAttack';
                    break;
                case 'Fernkampfangriff':
                    expr = '1d20 + sActor.pf_baseAttackBonus + sActor.pf_dexMod + sActor.modAttack';
                    break;
                case 'Schaden':
                    expr += ' + sActor.modDamage';
                    break;
            }

            // add throw
            if (throws != '') throws += ';';
            throws += t['Name'] + ';/r ' + expr;
        }
    }
    //TODO: add data defined throws
    const macro = `?SCRIPT?\nsendChat("/pf_use "+self.manager+"-"+self.id+" ${throws}");\n`;
    attachment.setString('macro', macro);

    return attachment;
}


function createSchoolString(entry) {
    var str = entry['Schule'];
    if (entry['Unterschule'].length > 0) str += ` ${getCombinedString(entry['Unterschule'], true)}`;
    if (entry['Kategorie'].length > 0) str += ` [${getCombinedString(entry['Kategorie'], false)}]`;
    return str;
}

//  +                                                                                        Magier                                                                                                                                                     Jäger
const gradProperties = ['Alchemist', 'Antipaladin', 'Barde', 'Blutwüter', 'Druide', 'Hexe', 'Hexenmeister', 'Inquisitor', 'Kampfmagus', 'Kleriker', 'Medium', 'Mentalist', 'Mesmerist', 'Okkultist', 'Paladin', 'Paktmagier', 'Schamane', 'Spiritist', 'Waldläufer'];
const gradShorthands = ['ALC', 'ANP', 'BAR', 'BLU', 'DRU', 'HEX', 'HXM/MAG', 'INQ', 'KAM', 'KLE', 'MED', 'MEN', 'MES', 'OKK', 'PAL', 'PKM', 'SHA', 'SPI', 'WAL'];

function createGradString(entry) {
    const grad = entry['Grad'];

    var result = '';
    for (var i = 0; i < gradProperties.length; i++) {
        if (grad[gradProperties[i]] != null && grad[gradProperties[i]] != undefined) {
            if (result) result += ', ';
            result += `${gradShorthands[i]} ${grad[gradProperties[i]]}`;
        }
    }
    return result;
}

function appendGradTags(tags, grad) {
    for (var i = 0; i < gradProperties.length; i++) {
        if (grad[gradProperties[i]] != null && grad[gradProperties[i]] != undefined) {
            for (const split of gradShorthands[i].split('/')) {
                tags += `zauber:${split.toLowerCase()}:${grad[gradProperties[i]]}\n`;
            }
        }
    }
    return tags;
}

function createCastingTimeString(entry) {
    if (entry['Zeitaufwand']) {
        if (entry['Zeitaufwand']['Spezial']) return 'Siehe Text';
        else return `${entry['Zeitaufwand']['Mindestens'] ? 'Mindestens ' : ''}${entry['Zeitaufwand']['Wert']} ${entry['Zeitaufwand']['Einheit']}`;
    } else {
        return '';
    }
}

function createComponentsString(entry) {
    if (entry['Komponenten']) {
        var alternatives = '';
        for (const alternative of entry['Komponenten']) {
            if (alternatives != '') alternatives += ' oder ';
            var components = '';
            for (const component of alternative) {
                if (components != '') components += ', ';

                var type = '';
                const addType = t => (type == '' ? type = t : type += '/' + t);
                if (component['Verbal']) addType('V');
                if (component['Gestik']) addType('G');
                if (component['Material']) addType('M');
                if (component['Fokus']) addType('F');
                if (component['GottesFokus']) addType('GF');

                components += getStringWithNotes(type, component['Komponenten'], true);
            }
            alternatives += components;
        }
        return alternatives;
    } else {
        return '';
    }
}

const knownSaves = ['Reflex', 'Willen', 'Zähigkeit'];
const knownSaveMacros = ['!!Rettungswürfe/Reflex', '!!Rettungswürfe/Willen', '!!Rettungswürfe/Zähigkeit'];

function createSaveString(entry) {
    if (entry['Rettungswurf']) {
        var saves = '';
        for (const save of entry['Rettungswurf']) {
            if (saves != '') saves += ' oder ';

            if (save['Art']) {
                saves += save['Art'];
                if (save['Effekt']) saves += `, ${save['Effekt']}`;
            } else if (save['Effekt']) {
                saves += save['Effekt'];
            }
        }
        return saves;
    } else {
        return '';
    }
}

function createSRString(entry) {
    if (entry['Zauberresistenz']) {
        return getStringWithNotes(entry['Zauberresistenz']['Wert'] ? 'Ja' : 'Nein', entry['Zauberresistenz']['Anmerkung'], true);
    } else {
        return '';
    }
}

const throwVariables = {
    '<<Level>>': 'sActor.pf_level',
    '<<Stärke>>': 'sActor.pf_strMod',
    '<<Geschicklichkeit>>': 'sActor.pf_dexMod',

    '<<RK>>': 'sActor.pf_ac',
    '<<RK-B>>': 'sActor.pf_acTouch',
    '<<RK-ADFF>>': 'sActor.pf_acFlatFooted'
}