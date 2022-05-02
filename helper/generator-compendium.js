import { Entity } from '../core/common/common.js';
import { Access } from '../core/common/constants.js';
import { prettyTextToHTML } from './formatter.js';
import { getCombinedString, getNullableStringWithNotes, getSigned } from './generator-utils.js';

export function createMagicalItem(entry) {
    // add 'default' values for missing entries
    if (!entry['Gewicht']) entry['Gewicht'] = { Wert: 0, Anmerkung: '' };
    if (!entry['Preis']) entry['Preis'] = { Wert: 0, Anmerkung: '' };
    if (!entry['ZS']) entry['ZS'] = { Wert: 0, Anmerkung: '' };
    if (!entry['Platz']) entry['Platz'] = '-';

    // get basic info
    const name = entry['Name'].replace('/', '-');
    const descShort = entry['Beschreibung'];

    var art = entry['Art'];
    if (art.includes(',')) art = art.substring(0, art.indexOf(','));
    const path = 'Gegenstände/Magisch/' + art + '/';

    // build full description
    var content = '';
    {
        content += '<p>';
        {
            // aura zs
            content += `<strong>Aura:</strong> ${entry['Aura']}; <strong>ZS</strong> ${getNullableStringWithNotes(entry['ZS'], '')}<br>`;

            // slot, weight
            content += `<strong>Ausrüstungsplatz:</strong> ${entry['Platz']}; <strong>Gewicht: </strong> ${getNullableStringWithNotes(entry['Gewicht'], ' Pfd')}<br>`;

            // cost
            content += `<strong>Marktpreis:</strong> ${getNullableStringWithNotes(entry['Preis'], ' GM')}<br>`;
        }
        content += '</p>';
        content += '<p>&nbsp;</p>';

        // desc
        content += '<h6>BESCHREIBUNG:</h6>';
        content += prettyTextToHTML(descShort, true);
        content += '<p>&nbsp;</p>';

        // creation
        if (entry['Erschaffung']) {
            content += '<p>&nbsp;</p>';
            content += '<h6>ERSCHAFFUNG:</h6>';
            if (entry['Erschaffung']['Kosten']) content += `<strong>Kosten:</strong> ${entry['Erschaffung']['Kosten']}<br>`;
            if (entry['Erschaffung']['Voraussetzungen']) {
                content += `<strong>Voraussetzungen:</strong> ${getCombinedString(entry['Erschaffung']['Voraussetzungen'])}<br>`;
            }
        }

        // destruction
        if (entry['Zerstörung']) {
            content += '<h6>ZERSTÖRUNG:</h6>';
            content += `${entry['Zerstörung']}`;
        }

        content += '<p>&nbsp;</p>';
        content += `<p>${entry['Regelwerk']} - Seite ${entry['Seite']}</p>`;
    }

    // generate compendium entity
    console.log(`Generating Item: ${name}`);
    const compendium = new Entity('compendium');
    compendium.setString('name', name);
    compendium.setString('path', path);
    compendium.setString('content', content);
    compendium.setAccessValue('access', Access.GM);
    return compendium;
}

export function createEnchantment(entry) {
    // add 'default' values for missing entries
    if (!entry['Preis']) entry['Preis'] = '-';
    if (!entry['ZS']) entry['ZS'] = 0;
    if (!entry['Platz']) entry['Platz'] = '-';

    // get basic info
    const name = entry['Name'].replace('/', '-');
    const descShort = entry['Beschreibung'];

    const path = 'Gegenstände/Verzauberungen/' + entry['Platz'] + '/';

    // build full description
    var content = '';
    {
        content += '<p>';
        {
            // aura zs
            content += `<strong>Aura:</strong> ${entry['Aura']}; <strong>ZS</strong> ${entry['ZS']}<br>`;

            // slot
            content += `<strong>Platz:</strong> ${entry['Platz']}<br>`;

            // cost
            content += `<strong>Marktpreis:</strong> ${entry['Preis']}<br>`;
        }
        content += '</p>';
        content += '<p>&nbsp;</p>';

        // desc
        content += '<h6>BESCHREIBUNG:</h6>';
        content += prettyTextToHTML(descShort, true);
        content += '<p>&nbsp;</p>';

        // creation
        content += '<p>&nbsp;</p>';
        content += '<h6>ERSCHAFFUNG:</h6>';
        content += `<strong>Kosten:</strong> ${entry['Erschaffung']['Kosten']}<br>`;

        content += `<strong>Voraussetzungen:</strong> ${getCombinedString(entry['Erschaffung']['Voraussetzungen'])}<br>`;

        content += '<p>&nbsp;</p>';
        content += `<p>${entry['Regelwerk']} - Seite ${entry['Seite']}</p>`;
    }

    // generate compendium entity
    console.log(`Generating Enchantment: ${name}`);
    const compendium = new Entity('compendium');
    compendium.setString('name', name);
    compendium.setString('path', path);
    compendium.setString('content', content);
    compendium.setAccessValue('access', Access.GM);
    return compendium;
}

export function createWeapon(entry) {
    // get basic info
    const name = entry['Name'].replace('/', '-');
    const descShort = entry['Beschreibung'];

    const path = 'Gegenstände/Waffen/' + entry['Klasse'] + '/' + entry['Art'] + '/';

    // build full description
    var content = '';
    {
        content += '<p>';
        {
            // damage
            content += `<strong>Schaden (Mittelgroß):</strong> ${entry['Schaden']['Mittelgroß']}<br>`;
            content += `<strong>Schaden (Klein):</strong> ${entry['Schaden']['Klein']}<br>`;
            content += `<strong>Kritisch:</strong> ${entry['Schaden']['Kritisch']}<br>`;
            content += `<strong>Art:</strong> ${entry['Schaden']['Art']}<br>`;

            // range
            if (entry['Grundreichweite']) {
                content += `<strong>Grundreichweite:</strong> ${entry['Grundreichweite']}<br>`;
            }

            // specials
            if (entry['Speziell'] && entry['Speziell'].length > 0) {
                content += `<strong>Speziell:</strong> ${getCombinedString(entry['Speziell'])}<br>`;
            }

            // cost weight
            content += `<strong>Preis:</strong> ${entry['Preis']} GM; <strong>Gewicht:</strong> ${entry['Gewicht']} Pfd<br>`;
        }
        content += '</p>';
        content += '<p>&nbsp;</p>';

        // desc
        content += '<h6>BESCHREIBUNG:</h6>';
        content += prettyTextToHTML(descShort, true);
        content += '<p>&nbsp;</p>';
    }

    // generate compendium entity
    console.log(`Generating Weapon: ${name}`);
    const compendium = new Entity('compendium');
    compendium.setString('name', name);
    compendium.setString('path', path);
    compendium.setString('content', content);
    compendium.setAccessValue('access', Access.EVERYONE);
    return compendium;
}

export function createArmor(entry) {
    // get basic info
    const name = entry['Name'].replace('/', '-');
    const descShort = entry['Beschreibung'];

    const path = 'Gegenstände/Rüstungen/' + entry['Art'] + '/';

    // build full description
    var content = '';
    {
        content += '<p>';
        {
            // bonus
            content += `<strong>Rüstungsbonus:</strong> ${getSigned(entry['Bonus'])}<br>`;

            // mali
            if (entry['MaxGE'] != undefined) {
                content += `<strong>Maximaler GE-Bonus:</strong> ${getSigned(entry['MaxGE'])}<br>`;
            }
            content += `<strong>Rüstungsmalus:</strong> ${getSigned(entry['Rüstungsmalus'])}<br>`;
            if (entry['Zauberpatzer']) content += `<strong>Chance auf Arkane Zauberpatzer:</strong> ${entry['Zauberpatzer']}<br>`;
            if (entry['Bewegungsrate'] != undefined) {
                content += `<strong>Bewegungsrate (9m):</strong> ${entry['Bewegungsrate']['9m']}; <strong>Bewegungsrate (6m):</strong> ${entry['Bewegungsrate']['6m']}<br>`;
            }

            // cost weight
            content += `<strong>Preis:</strong> ${entry['Preis']} GM; <strong>Gewicht:</strong> ${entry['Gewicht']} Pfd<br>`;
        }
        content += '</p>';
        content += '<p>&nbsp;</p>';

        // desc
        content += '<h6>BESCHREIBUNG:</h6>';
        content += prettyTextToHTML(descShort, true);
        content += '<p>&nbsp;</p>';
    }

    // generate compendium entity
    console.log(`Generating Armor: ${name}`);
    const compendium = new Entity('compendium');
    compendium.setString('name', name);
    compendium.setString('path', path);
    compendium.setString('content', content);
    compendium.setAccessValue('access', Access.EVERYONE);
    return compendium;
}
