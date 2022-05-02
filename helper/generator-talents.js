import { Entity } from '../core/common/common.js';
import { getCombinedString } from './generator-utils.js';

import fs from 'fs-extra';

export function createTalent(entry, talenteIcons) {
    // get basic data
    const name = entry['Name'];
    const descShort = entry['TextBeschreibung'] ? entry['TextBeschreibung'] : entry['Beschreibung'];

    // notify of some errors
    const imagePath = talenteIcons[name];
    if (imagePath && !fs.existsSync('./generated/files/image/' + imagePath)) throw new Error(`Talent ${name} has broken image path: ${imagePath}`);

    // build full description
    var descFull = '';
    {
        if (entry['Voraussetzungen'] && entry['Voraussetzungen'].length > 0) {
            descFull += '<p>';
            descFull += `<strong>Voraussetzung:</strong> ${getCombinedString(entry['Voraussetzungen'], false)}`;
            descFull += '</p>';
        }

        descFull += '<p>';
        if (entry['VolleBeschreibung']) descFull += entry['VolleBeschreibung'];
        descFull += '</p>';

        descFull += '<p>';
        descFull += `${entry['Regelwerk']} - Seite ${entry['Seite']}`;
        descFull += '</p>';
    }

    // generate attachment entity
    console.log(`Generating Talent: ${name}`);
    const attachment = new Entity('attachment');
    attachment.setString('name', name.replace(/\//, '\\'));
    attachment.setString('path', 'Talente/');
    if (imagePath) attachment.setString('imagePath', '/image/' + imagePath);
    attachment.setString('descShort', descShort);
    attachment.setString('descFull', descFull);
    attachment.setString('tags', '');

    return attachment;
}
