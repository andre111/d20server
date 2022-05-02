import { Common, Entity } from '../core/common/common.js'
import { ModuleService } from '../core/server/service/module-service.js'
import { readJsonFile, saveJsonFile } from '../core/server/util/fileutil.js';

import { GeneratorEntityManager, GeneratorIDProvider } from './generator-dummies.js';
import { prettyTextToHTML } from './formatter.js';

import fs from 'fs-extra';
import path from 'path';
import { Access } from '../core/common/constants.js';
import { EntityManagers } from '../core/common/entity/entity-managers.js';
import { createSpell } from './generator-spells.js';
import { createTalent } from './generator-talents.js';
import { createActor } from './generator-actors.js';
import { createArmor, createEnchantment, createMagicalItem, createWeapon } from './generator-compendium.js';

const FULL_RESET = false;

const GENERATE_ATTACHMENTS = true;
const GENERATE_GENERIC_ATTACHMENTS = true;
const GENERATE_SPELLS = true;
const GENERATE_TALENTS = true;

const GENERATE_ACTORS = true; // should only be set to true if attachments are generated -> else no links will be made

const GENERATE_COMPENDIUM = true;

Common.init(true, new GeneratorIDProvider(), GeneratorEntityManager);
ModuleService.init().then(() => {
    EntityManagers.createAll();
    doGenerate();
});

// Data / ID Map Storage
const attachmentMap = {};
const genericAttachmentIDMap = {};
const zauberIDMap = {};
const talenteIDMap = {};

// Actual Functions
function doGenerate() {
    const directory = './generated/';
    if (FULL_RESET) {
        // reset generated data
        if (fs.existsSync(directory)) fs.removeSync(directory);
        fs.mkdirsSync(directory);

        // import images
        console.log('Importing images... (this may take a while)')
        const imageDirectory = '../d20helper/dataSRC/images/';
        fs.copySync(imageDirectory, path.join(directory, '/files/image/'));
    }

    // generate attachments
    if (GENERATE_ATTACHMENTS) {
        // generic attachments
        if (GENERATE_GENERIC_ATTACHMENTS) {
            const attachmentData = getCombinedJsonData('../d20helper/dataFull/attachments/');
            var attachmentsWithIcon = 0;
            for (const entry of attachmentData) {
                // get basic info
                const name = entry['Name'];
                const tags = entry['Tags'];
                const imagePath = entry['Icon'];
                const descShort = entry['KurzBeschreibung'];
                const descFull = prettyTextToHTML(entry['Beschreibung']);

                // generate attachment entity
                console.log(`Generating Attachment: ${name}`);
                const attachment = new Entity('attachment');
                attachment.setString('name', name);
                attachment.setString('tags', tags);
                if (imagePath) {
                    attachment.setString('imagePath', '/image/' + imagePath);
                    attachmentsWithIcon++;
                }
                attachment.setString('descShort', descShort);
                attachment.setString('descFull', descFull);

                attachmentMap[String(attachment.getID())] = attachment;
                genericAttachmentIDMap[toUnifiedName(name)] = attachment.getID();
            }
            console.log(`Attachments with icon: ${attachmentsWithIcon}/${attachmentData.length} (${attachmentsWithIcon / attachmentData.length * 100}%)`);
        }

        // Zauber
        if (GENERATE_SPELLS) {
            const zauberData = getCombinedJsonData('../d20helper/dataFull/zauber/');
            const zauberIcons = readJsonFile('../d20helper/dataFull/zauber_icons.json');
            var zauberWithIcon = 0;
            for (const entry of zauberData) {
                // get basic info
                const name = entry['Name'];
                const attachment = createSpell(entry, zauberIcons);
                if (attachment.getString('imagePath')) zauberWithIcon++;

                attachmentMap[String(attachment.getID())] = attachment;
                zauberIDMap[toUnifiedName(name)] = attachment.getID();
            }
            console.log(`Zauber with icon: ${zauberWithIcon}/${zauberData.length} (${zauberWithIcon / zauberData.length * 100}%)`);
        }

        // Talente
        if (GENERATE_TALENTS) {
            const talenteData = getCombinedJsonData('../d20helper/dataFull/talente/');
            const talenteIcons = readJsonFile('../d20helper/dataFull/talente_icons.json');
            var talenteWithIcon = 0;
            for (const entry of talenteData) {
                // get basic data
                const name = entry['Name'];
                const attachment = createTalent(entry, talenteIcons);
                if (attachment.getString('imagePath')) talenteWithIcon++;

                attachmentMap[String(attachment.getID())] = attachment;
                talenteIDMap[toUnifiedName(name)] = attachment.getID();
            }
            console.log(`Talente with icon: ${talenteWithIcon}/${talenteData.length} (${talenteWithIcon / talenteData.length * 100}%)`);
        }

        saveJsonFile(path.join(directory, 'attachment.json'), attachmentMap);
    }

    // generate actors
    if (GENERATE_ACTORS) {
        const actorMap = {};
        {
            const monsterData = getCombinedJsonData('../d20helper/dataFull/monster/');
            const monsterIcons = readJsonFile('../d20helper/dataFull/monster_icons.json');
            var monsterWithIcon = 0;
            for (const entry of monsterData) {
                const name = entry['Name'];
                const monsterActor = createActor(entry, monsterIcons);
                if (monsterActor.getString('imagePath') != 'tokens/unknown.png') monsterWithIcon++;

                // add actor
                console.log(`Generating Monster Actor: ${name}`);
                actorMap[String(monsterActor.getID())] = monsterActor;
            }
            console.log(`Monster with icon: ${monsterWithIcon}/${monsterData.length} (${monsterWithIcon / monsterData.length * 100}%)`);
        }
        saveJsonFile(path.join(directory, 'actor.json'), actorMap);
    }

    // generate compendium
    if (GENERATE_COMPENDIUM) {
        const compendiumMap = {};
        {
            // manual files
            const basePath = '../d20helper/dataFull/compendium/';
            const files = fs.readdirSync(basePath);
            while (files.length > 0) {
                const file = files.splice(files.length - 1, 1)[0];
                const stats = fs.lstatSync(basePath + file);

                if (stats.isDirectory()) {
                    const newFiles = fs.readdirSync(basePath + file);
                    for (const newFile of newFiles) files.push(file + '/' + newFile);
                } else if (stats.isFile()) {
                    // get basic info
                    const namePath = file.replace('.txt', '').replace('_', '');
                    const name = (namePath.includes('/') ? namePath.substring(namePath.lastIndexOf('/') + 1) : namePath).replace('.txt', '');
                    const path = namePath.includes('/') ? namePath.substring(0, namePath.lastIndexOf('/') + 1) : '';
                    const content = prettyTextToHTML(fs.readFileSync(basePath + file, { encoding: 'utf-8' }), true);
                    const access = file.includes('_') ? Access.GM : Access.EVERYONE;

                    // generate compendium entity
                    console.log(`Generating Compendium: ${name}`);
                    const compendium = new Entity('compendium');
                    compendium.setString('name', name);
                    compendium.setString('path', path);
                    compendium.setString('content', content);
                    compendium.setAccessValue('access', access);

                    compendiumMap[String(compendium.getID())] = compendium;
                }
            }

            // magical items
            const itemData = getCombinedJsonData('../d20helper/dataFull/items/magical/');
            for (const entry of itemData) {
                const compendium = createMagicalItem(entry);
                compendiumMap[String(compendium.getID())] = compendium;
            }

            // enchantments
            const enchantmentData = getCombinedJsonData('../d20helper/dataFull/enchantments/');
            for (const entry of enchantmentData) {
                const compendium = createEnchantment(entry);
                compendiumMap[String(compendium.getID())] = compendium;
            }

            // weapons
            const weaponData = getCombinedJsonData('../d20helper/dataFull/items/weapons/');
            for (const entry of weaponData) {
                const compendium = createWeapon(entry);
                compendiumMap[String(compendium.getID())] = compendium;
            }

            // armor
            const armorData = getCombinedJsonData('../d20helper/dataFull/items/armor/');
            for (const entry of armorData) {
                const compendium = createArmor(entry);
                compendiumMap[String(compendium.getID())] = compendium;
            }
        }
        saveJsonFile(path.join(directory, 'compendium.json'), compendiumMap);
    }
}

function getCombinedJsonData(directory) {
    var combinedData = [];
    for (const fileName of fs.readdirSync(directory)) {
        const filePath = path.join(directory, fileName);
        if (fs.statSync(filePath).isFile() && fileName.endsWith('.json')) {
            const object = readJsonFile(filePath);
            // either it contains a 'data' array of entries or is a single entry directly
            if (object['data']) {
                const data = object['data'];
                combinedData = combinedData.concat(data);
            } else {
                combinedData.push(object);
            }
        } else if (fs.statSync(filePath).isDirectory()) {
            combinedData = combinedData.concat(getCombinedJsonData(filePath));
        }
    }
    return combinedData;
}

export function getTalentID(name) {
    var uname = toUnifiedName(name);

    // try to find the matching talent (first simply with unified name, then ignoring brackets, then adding '(legende)')
    if (!talenteIDMap[uname] && uname.includes('(')) uname = uname.substring(0, uname.indexOf('(')).trim();
    if (!talenteIDMap[uname] && talenteIDMap[uname + '(legende)']) uname = uname + '(legende)';
    if (!talenteIDMap[uname]) return -1;

    return talenteIDMap[uname];
}

export function getZauberID(name) {
    var uname = toUnifiedName(name, false);

    // try to find the matching spell
    if (!zauberIDMap[uname]) uname = toUnifiedName(name, true);
    if (!zauberIDMap[uname]) return -1;

    return zauberIDMap[uname];
}

export function toUnifiedName(name, removeModifier) {
    name = name.toLowerCase();
    if (removeModifier) {
        if (name.startsWith('schnelles ')) name = name.substring(10);
        if (name.startsWith('schneller ')) name = name.substring(10);
        if (name.startsWith('schnelle ')) name = name.substring(9);

        if (name.startsWith('maximiertes ')) name = name.substring(12);
        if (name.startsWith('maximierter ')) name = name.substring(12);
        if (name.startsWith('maximierte ')) name = name.substring(11);

        if (name.startsWith('mächtiges ')) name = name.substring(10);
        if (name.startsWith('mächtiger ')) name = name.substring(10);
        if (name.startsWith('mächtige ')) name = name.substring(9);

        if (name.startsWith('ausgedehntes ')) name = name.substring(13);
        if (name.startsWith('ausgedehnter ')) name = name.substring(13);
        if (name.startsWith('ausgedehnte ')) name = name.substring(12);

        if (name.startsWith('massen ')) name = name.substring(7);
    }
    return name.replace(/\s/g, '').replace(/-/g, '').trim();
}
