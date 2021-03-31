import { Common, Entity } from '../core/common/common.js'
import { ModuleService } from '../core/server/service/module-service.js'
import { readJson, readJsonFile, saveJsonFile } from '../core/server/util/fileutil.js';

import { GeneratorIDProvider } from './id.js';
import { prettyTextToHTML } from './formatter.js';

import fs from 'fs-extra';
import path from 'path';

const FULL_RESET = false;
const IGNORE_MISSING_IMAGES = false;

//TODO: split this into more sensible parts
Common.init(new GeneratorIDProvider(), null);
ModuleService.init().then(() => {
    //TODO: implement/port generator

    const directory = './generated/';
    if(FULL_RESET) {
        // reset generated data
        if(fs.existsSync(directory)) fs.removeSync(directory);
        fs.mkdirsSync(directory);

        // import images
        console.log('Importing images... (this may take a while)')
        const imageDirectory = '../d20helper/dataSRC/images/';
        fs.copySync(imageDirectory, path.join(directory, '/files/image/'));
    }

    // generate attachments
    const attachmentMap = {};
    const genericAttachmentIDMap = {};
    const zauberIDMap = {};
    const talenteIDMap = {};
    {
        // generic attachments
        const attachmentData = getCombinedJsonData('../d20helper/dataFull/attachments/');
        var attachmentsWithIcon = 0;
        for(const entry of attachmentData) {
            // get basic info
            const name = entry['Name'];
            const tags = entry['Tags'];
            const imagePath = entry['Icon'];
            const descShort = entry['KurzBeschreibung'];
            const descFull = prettyTextToHTML(entry['Beschreibung']);
            
            // generate attachment entity
            console.log(`Generating Attachment: ${name}`);
            const attachment = new Entity('attachment');
            attachment.prop('name').setString(name);
            attachment.prop('tags').setString(tags);
            if(imagePath) {
                attachment.prop('imagePath').setString('/image/'+imagePath);
                attachmentsWithIcon++;
            }
            attachment.prop('descShort').setString(descShort);
            attachment.prop('descFull').setString(descFull);

            attachmentMap[String(attachment.getID())] = attachment;
            genericAttachmentIDMap[toUnifiedName(name)] = attachment.getID();
        }
        console.log(`Attachments with icon: ${attachmentsWithIcon}/${attachmentData.length} (${attachmentsWithIcon/attachmentData.length*100}%)`);

        // Zauber
        const zauberData = getCombinedJsonData('../d20helper/dataFull/zauber/');
        const zauberIcons = readJsonFile('../d20helper/dataFull/zauber_icons.json');
        var zauberWithIcon = 0;
        for(const entry of zauberData) {
            // get basic info
            const name = entry['Name'];
            const descShort = entry['Beschreibung'];

            // notify of some errors
            const imagePath = zauberIcons[name];
            if(imagePath && !IGNORE_MISSING_IMAGES && !fs.existsSync('./generated/files/image/'+imagePath)) throw new Error(`Zauber ${name} has broken image path: ${imagePath}`);
            if(imagePath) zauberWithIcon++;

            // build full description
            var descFull = '';
            {
                descFull += '<p>';
                descFull += `<strong>Schule:</strong> ${entry['Schule']}`;
                if(entry['Unterschule']) descFull += ` (${entry['Unterschule']})`;
                if(entry['Kategorie']) descFull += ` [${entry['Kategorie']}]`;
                descFull += `; <strong>Grad:</strong> ${createGradString(entry['Grad'])}<br>`;

                if(entry['Zeitaufwand']) descFull += `<strong>Zeitaufwand:</strong> ${entry['Zeitaufwand']}<br>`;
                if(entry['Komponenten']) descFull += `<strong>Komponenten:</strong> ${entry['Komponenten']}<br>`;
                if(entry['Reichweite']) descFull += `<strong>Reichweite:</strong> ${entry['Reichweite']}<br>`;
                if(entry['Ziel']) descFull += `<strong>Ziel:</strong> ${entry['Ziel']}<br>`;
                if(entry['Effekt']) descFull += `<strong>Effekt:</strong> ${entry['Effekt']}<br>`;
                if(entry['Wirkungsbereich']) descFull += `<strong>Wirkungsbereich:</strong> ${entry['Wirkungsbereich']}<br>`;
                if(entry['Wirkungsdauer']) descFull += `<strong>Wirkungsdauer:</strong> ${entry['Wirkungsdauer']}<br>`;
                if(entry['Rettungswurf']) {
                    descFull += `<strong>Rettungswurf:</strong> ${entry['Rettungswurf']}`;
                    if(entry['Zauberresistenz']) descFull += `; <strong>Zauberresistenz:</strong> ${entry['Zauberresistenz']}`;
                    descFull += '<br>';
                } else {
                    if(entry['Zauberresistenz']) descFull += `<strong>Zauberresistenz:</strong> ${entry['Zauberresistenz']}<br>`;
                }
                descFull += '</p>';

                descFull += '<p>';
                descFull += prettyTextToHTML(entry['VolleBeschreibung']);
                descFull += '</p>';

                descFull += '<p>';
                descFull += `${entry['Regelwerk']} - Seite ${entry['Seite']}`;
                descFull += '</p>';
            }
            
            // build search tags
            var tags = '';
            tags = appendGradTags(tags, entry['Grad']);

            // generate attachment entity
            console.log(`Generating Zauber: ${name}`);
            const attachment = new Entity('attachment');
            attachment.prop('name').setString('Zauber/'+name.replace(/\//, '\\'));
            if(imagePath) attachment.prop('imagePath').setString('/image/'+imagePath);
            attachment.prop('descShort').setString(descShort);
			attachment.prop('descFull').setString(descFull);
            attachment.prop('tags').setString(tags);
            
            attachmentMap[String(attachment.getID())] = attachment;
            zauberIDMap[toUnifiedName(name)] = attachment.getID();
        }
        console.log(`Zauber with icon: ${zauberWithIcon}/${zauberData.length} (${zauberWithIcon/zauberData.length*100}%)`);

        // Talente
        const talenteData = getCombinedJsonData('../d20helper/dataFull/talente/');
        const talenteIcons = readJsonFile('../d20helper/dataFull/talente_icons.json');
        var talenteWithIcon = 0;
        for(const entry of talenteData) {
            // get basic data
            const name = entry['Name'];
            const descShort = entry['TextBeschreibung'] ? entry['TextBeschreibung'] : entry['Beschreibung'];

            // notify of some errors
            const imagePath = talenteIcons[name];
            if(imagePath && !IGNORE_MISSING_IMAGES && !fs.existsSync('./generated/files/image/'+imagePath)) throw new Error(`Talent ${name} has broken image path: ${imagePath}`);
            if(imagePath) talenteWithIcon++;

            // build full description
            var descFull = '';
            {
                if(entry['Voraussetzung']) {
                    descFull += '<p>';
                    descFull += `<strong>Voraussetzung:</strong> ${entry['Voraussetzung']}`;
                    descFull += '</p>';
                }

                descFull += '<p>';
                if(entry['VolleBeschreibung']) descFull += entry['VolleBeschreibung'];
                descFull += '</p>';

                descFull += '<p>';
                descFull += `${entry['Regelwerk']} - Seite ${entry['Seite']}`;
                descFull += '</p>';
            }

            // generate attachment entity
            console.log(`Generating Talent: ${name}`);
            const attachment = new Entity('attachment');
            attachment.prop('name').setString('Talente/'+name.replace(/\//, '\\'));
            if(imagePath) attachment.prop('imagePath').setString('/image/'+imagePath);
            attachment.prop('descShort').setString(descShort);
			attachment.prop('descFull').setString(descFull);
            attachment.prop('tags').setString('');
            
            attachmentMap[String(attachment.getID())] = attachment;
            talenteIDMap[toUnifiedName(name)] = attachment.getID();
        }
        console.log(`Talente with icon: ${talenteWithIcon}/${talenteData.length} (${talenteWithIcon/talenteData.length*100}%)`);
    }
    saveJsonFile(path.join(directory, 'attachment.json'), attachmentMap);

    //TODO: generate actors
    const actorMap = {};
    {
        const monsterData = getCombinedJsonData('../d20helper/dataFull/monster/');
        const monsterIcons = readJsonFile('../d20helper/dataFull/monster_icons.json');
        var monsterWithIcon = 0;
        for(const entry of monsterData) {
            // get basic info
            const name = entry['Name'];
            const hgString = entry['HG'] ? (entry['HG'].length < 2 ? '0' + entry['HG'] : entry['HG']) : '?';

            // create entity
            const monsterActor = new Entity('actor');
            monsterActor.prop('name').setString(`Monster/HG ${hgString}/${name.replace(/\//g, '\\')}`);

            // apply properties
            monsterActor.prop('pf_characterName').setString(name);
            monsterActor.prop('pf_alignment').setString(entry['Gesinnung']);
            monsterActor.prop('pf_class').setString(entry['Art']['Klasse']);
            monsterActor.prop('pf_race').setString(getStringWithNotes(entry['Art']['Art'], entry['Art']['Unterart'], true));

            monsterActor.prop('pf_str').setLong(entry['Attribute']['Stärke']);
            monsterActor.prop('pf_dex').setLong(entry['Attribute']['Geschicklichkeit']);
            monsterActor.prop('pf_con').setLong(entry['Attribute']['Konstitution']);
            monsterActor.prop('pf_int').setLong(entry['Attribute']['Intelligenz']);
            monsterActor.prop('pf_wis').setLong(entry['Attribute']['Weisheit']);
            monsterActor.prop('pf_cha').setLong(entry['Attribute']['Charisma']);
            
            monsterActor.prop('pf_baseAttackBonus').setLong(entry['GAB']);

            const currentInit = monsterActor.prop('pf_initMod').getLong();
            const targetInit = entry['Initiative']['Wert'];
            monsterActor.prop('pf_initMiscMod').setLong(targetInit - currentInit);
            
            monsterActor.prop('pf_spellResistance').setLong(entry['Verteidigung']['ZR']['Wert']);

            // armor class //TODO: check against provided value
            var acArmorBonus = 0;
			var acShieldBonus = 0;
			var acSizeMod = 0;
			var acNaturalArmor = 0;
			var acDeflectionMod = 0;
            var acMiscMod = 0;
            const acModArray = entry['RK']['Modifikatoren'];
            for(const acModObject of acModArray) {
                switch(acModObject['Typ']) {
                case 'GE':
                    break; // should already be included
                case 'Rüstung':
                    acArmorBonus += acModObject['Wert'];
                    break;
                case 'Schild':
                    acShieldBonus += acModObject['Wert'];
                    break;
                case 'Größe':
                    acSizeMod += acModObject['Wert'];
                    break;
                case 'NatürlicheRüstung':
                    acNaturalArmor += acModObject['Wert'];
                    break;
                case 'Ablenkung':
                    acDeflectionMod += acModObject['Wert'];
                    break;
                case 'Sonstige':
                    acMiscMod += acModObject['Wert'];
                    break;
                default:
                    throw new Error(`Unknown AC Mod: ${acModObject['Typ']}`);
                }
            }

            monsterActor.prop('pf_acArmorBonus').setLong(acArmorBonus);
            monsterActor.prop('pf_acShieldBonus').setLong(acShieldBonus);
            monsterActor.prop('pf_acSizeMod').setLong(acSizeMod);
            monsterActor.prop('pf_acNaturalArmor').setLong(acNaturalArmor);
            monsterActor.prop('pf_acDeflectionMod').setLong(acDeflectionMod);
            monsterActor.prop('pf_acMiscMod').setLong(acMiscMod);
            monsterActor.prop('pf_sizeMod').setLong(-acSizeMod);

            // saves
            const currentSaveReflex = monsterActor.prop('pf_saveReflex').getLong();
            const targetSaveReflex = entry['Rettungswürfe']['Reflex']['Wert'];
            monsterActor.prop('pf_saveReflex').setLong(targetSaveReflex - currentSaveReflex);
            const currentSaveWill = monsterActor.prop('pf_saveWill').getLong();
            const targetSaveWill = entry['Rettungswürfe']['Willen']['Wert'];
            monsterActor.prop('pf_saveWill').setLong(targetSaveWill - currentSaveWill);
            const currentSaveFortitude = monsterActor.prop('pf_saveFortitude').getLong();
            const targetSaveFortitude = entry['Rettungswürfe']['Zähigkeit']['Wert'];
            monsterActor.prop('pf_saveFortitude').setLong(targetSaveFortitude - currentSaveFortitude);

            // abilities
            var auftretenIndex = 1;
            var berufIndex = 1;
            var handwerkIndex = 1;
            for(const abilityObject of entry['Fertigkeiten']) {
                const abilityFullName = abilityObject['Name'];
                var abilityName = toUnifiedName(abilityFullName);
                var abilityText = '';
                if(abilityName.startsWith('auftreten')) { abilityText = abilityFullName.substring(abilityFullName.indexOf('(')+1, abilityFullName.length-1); abilityName = 'auftreten'+(auftretenIndex++); }
                if(abilityName.startsWith('beruf')) { abilityText = abilityFullName.substring(abilityFullName.indexOf('(')+1, abilityFullName.length-1); abilityName = 'beruf'+(berufIndex++); }
                if(abilityName.startsWith('handwerk')) { abilityText = abilityFullName.substring(abilityFullName.indexOf('(')+1, abilityFullName.length-1); abilityName = 'handwerk'+(handwerkIndex++); }
            
                if(abilityNameMap[abilityName]) {
                    monsterActor.prop(abilityNameMap[abilityName]+'Class').setBoolean(true);
                    const currentAbilityValue = monsterActor.prop(abilityNameMap[abilityName]).getLong();
                    const targetAbilityValue = entry['Wert'];
                    monsterActor.prop(abilityNameMap[abilityName]+'Misc').setLong(targetAbilityValue - currentAbilityValue);
                    if(abilityText) monsterActor.prop(abilityNameMap[abilityName]+'Text').setString(abilityText);
                } else {
                    console.error(`${name}: Skipping unknown ability: ${abilityFullName}`);
                }
            }

            // bio //TODO: complete parsing and restoring of the remaining sections
            monsterActor.prop('bio').setString(entry['Beschreibung']);

            var gmBio = '';
            gmBio += createBaseSection(entry) + '<p></p>';
            gmBio += createDefenseSection(entry) + '<p></p>';
            gmBio += createAttackSection(entry) + '<p></p>';
            gmBio += createValuesSection(entry) + '<p></p>';
            gmBio += createEcologySection(entry) + '<p></p>';
            gmBio += createSpecialAbilitiesSection(entry) + '<p></p>';
            gmBio += '<hr><strong>BESCHREIBUNG:</strong><hr>';
            for(const descParagraph of entry['GMBeschreibung'].split('\n')) {
                gmBio += '<p>';
                gmBio += descParagraph;
                gmBio += '</p>';
            }
            gmBio += '<p>';
            gmBio += `${entry['Regelwerk']} - Seite ${entry['Seite']}`;
            gmBio += '</p>';
            monsterActor.prop('gmBio').setString(gmBio);

            // attachments
            var attachmentList = [];
            {
                // feats
                for(var talent of entry['Talente']) {
                    talent = toUnifiedName(talent);

                    // try to find the matching talent (first simply with unified name, then ignoring brackets, then adding '(legende)')
                    if(!talenteIDMap[talent] && talent.includes('(')) talent = talent.substring(0, talent.indexOf('(')).trim();
                    if(!talenteIDMap[talent] && talenteIDMap[talent+'(legende)']) talent = talent+'(legende)';
                    if(!talenteIDMap[talent]) {
                        console.error(`${name}: Skipping unknown talent: ${talent}`);
                        continue;
                    }

                    attachmentList.push(talenteIDMap[talent]);
                }

                // spells
                for(var zauberListe of entry['Zauberlisten']) {
                    for(var zauberEntry of zauberListe['Einträge']) {
                        for(var zauber of zauberEntry['Zauber']) {
                            zauber = toUnifiedName(zauber['Wert'], true);

                            // try to find the matching spell
                            if(!zauberIDMap[zauber]) {
                                console.error(`${name}: Skipping unknown spell: ${zauber}`);
                                continue;
                            }
        
                            attachmentList.push(zauberIDMap[zauber]);
                        }
                    }
                }
            }
            monsterActor.prop('attachments').setLongList(attachmentList);

            // create attack macros
            var macros = {};
            for(var type of ['Nahkampf', 'Fernkampf']) {
                const atEntry = entry['Angriff'][type];
                if(atEntry) {
                    for(const attack of atEntry) {
                        var macro = '';
                        for(var i=0; i<attack['Anzahl']; i++) {
                            const critRange = attack['KritischWert'] < 20 ? `cs>=${attack['KritischWert']}` : '';
                            const modCount = attack['Modifikatoren'].length;
                            for(var m=0; m<modCount; m++) {
                                macro += `/template attack21 ${attack['Name']};${(attack['Berührung'] ? 'Berührung' : '')+(modCount > 1 ? ` ${m+1}. Angriff ` : '')};Angriff;1d20${critRange}+${attack['Modifikatoren'][m]};Schaden;${attack['Formel']};${attack['SchadenUndEffekte']}\n`;
                            }
                        }

                        var macroName = type+'/';
                        if(attack['Anzahl'] > 1) macroName += `${attack['Anzahl']} `;
                        macroName += attack['Name'];

                        macros[macroName] = macro;
                    }
                }
            }
            monsterActor.prop('macros').setStringMap(macros);

            // create default token
            const monsterToken = new Entity('token');
            {
                var imagePath = 'tokens/unknown.png';
                if(monsterIcons[name]) imagePath = monsterIcons[name];
                if(monsterIcons[name] && !IGNORE_MISSING_IMAGES && !fs.existsSync('./generated/files/image/'+monsterIcons[name])) throw new Error(`Monster ${name} has broken image path: ${monsterIcons[name]}`);
                if(imagePath != 'tokens/unknown.png') monsterWithIcon++;

                monsterToken.prop('name').setString(name);
                if(imagePath) monsterToken.prop('imagePath').setString('/image/'+imagePath);
                monsterToken.prop('bar1Current').setLong(entry['TP']['Wert']);
                monsterToken.prop('bar1Max').setLong(entry['TP']['Wert']);
                monsterToken.prop('actorID').setLong(monsterActor.getID());

                var sizeMult = 1;
                if(acSizeMod>=1) sizeMult = 0.5;
                if(acSizeMod<=-1) sizeMult = 2;
                if(acSizeMod<=-2) sizeMult = 3;
                if(acSizeMod<=-4) sizeMult = 4;
                if(acSizeMod<=-8) sizeMult = 5;
                monsterToken.prop('width').setLong(monsterToken.prop('width').getLong() * sizeMult);
                monsterToken.prop('height').setLong(monsterToken.prop('height').getLong() * sizeMult);
            }
            monsterActor.prop('token').setEntity(monsterToken);

            //TODO: verify calculated values match expected results: ac, acTouch, acFlatFooted, cmb, cmd
            //TODO: specifically cmb and cmd seem like they cannot simply be calculated correctly in all cases

            // add actor
            console.log(`Generating Monster Actor: ${name}`);
            actorMap[String(monsterActor.getID())] = monsterActor;
        }
        console.log(`Monster with icon: ${monsterWithIcon}/${monsterData.length} (${monsterWithIcon/monsterData.length*100}%)`);
    }
    saveJsonFile(path.join(directory, 'actor.json'), actorMap);
})

function getCombinedJsonData(directory) {
    var combinedData = [];
    for(const fileName of fs.readdirSync(directory)) {
        const filePath = path.join(directory, fileName);
        if(fs.statSync(filePath).isFile() && fileName.endsWith('.json')) {
            const object = readJsonFile(filePath);
            // either it contains a 'data' array of entries or is a single entry directly
            if(object['data']) {
                const data = object['data'];
                combinedData = combinedData.concat(data);
            } else {
                combinedData.push(object);
            }
        } else if(fs.statSync(filePath).isDirectory()) {
            combinedData = combinedData.concat(getCombinedJsonData(filePath));
        }
    }
    return combinedData;
}

function toUnifiedName(name, removeModifier) {
    name = name.toLowerCase();
    if(removeModifier) {
        if(name.startsWith('schnelles ')) name = name.substring(10);
        if(name.startsWith('schneller ')) name = name.substring(10);
        if(name.startsWith('schnelle ')) name = name.substring(9);
        
        if(name.startsWith('maximiertes ')) name = name.substring(12);
        if(name.startsWith('maximierter ')) name = name.substring(12);
        if(name.startsWith('maximierte ')) name = name.substring(11);
        
        if(name.startsWith('mächtiges ')) name = name.substring(10);
        if(name.startsWith('mächtiger ')) name = name.substring(10);
        if(name.startsWith('mächtige ')) name = name.substring(9);
        
        if(name.startsWith('ausgedehntes ')) name = name.substring(13);
        if(name.startsWith('ausgedehnter ')) name = name.substring(13);
        if(name.startsWith('ausgedehnte ')) name = name.substring(12);

        if(name.startsWith('massen ')) name = name.substring(7);
    }
    return name.replace(/\s/g, '').replace(/-/g, '').trim();
}

function getCombinedString(array, brackets) {
    if(array.length == 0) return '';

    var sb = array.join(', ');
    if(brackets) sb = '(' + sb + ')';

    return sb;
}

function getStringWithNotes(string, notes, brackets) {
    var sb = string;

    var notesString = '';
    if(typeof(notes) === 'object') {
        notesString = getCombinedString(notes, brackets);
    } else if(notes) {
        notesString = String(notes);
        if(brackets && notesString) notesString = '(' + notesString + ')';
    }
    if(notesString) {
        sb += ' ';
        sb += notesString;
    }

    return sb;
}

function getSigned(value) {
    if(value > 0) {
        return '+'+value;
    } else {
        return ''+value;
    }
}

// Zauber Methods
//  +                                                                                        Magier/Kampfmagus                                                                                                                            Jäger
const gradProperties = [ 'Alchemist', 'Antipaladin', 'Barde', 'Blutwüter', 'Druide', 'Hexe', 'Hexenmeister', 'Inquisitor', 'Kleriker', 'Medium', 'Mentalist', 'Mesmerist', 'Okkultist', 'Paladin', 'Paktmagier', 'Schamane', 'Spiritist', 'Waldläufer' ];
const gradShorthands = [ 'ALC', 'ANP', 'BAR', 'BLU', 'DRU', 'HEX', 'HXM/MAG', 'INQ', 'KLE', 'MED', 'MEN', 'MES', 'OKK', 'PAL', 'PKM', 'SHA', 'SPI', 'WAL' ];

function createGradString(grad) {
    var result = '';
    for(var i=0; i<gradProperties.length; i++) {
        if(grad[gradProperties[i]] != undefined && grad[gradProperties[i]] != null) {
            if(result) result += ', ';
            result += `${gradShorthands[i]} ${grad[gradProperties[i]]}`;
        }
    }
    return result;
}

function appendGradTags(tags, grad) {
    for(var i=0; i<gradProperties.length; i++) {
        if(grad[gradProperties[i]] != undefined && grad[gradProperties[i]] != null) {
            for(const split of gradShorthands[i].split('/')) {
                tags += `zauber:${split.toLowerCase()}:${grad[gradProperties[i]]}\n`;
            }
        }
    }
    return tags;
}

// Actor / Monster Methods
const abilityNameMap = {};
abilityNameMap[toUnifiedName('Akrobatik')] = 'pf_skillAcrobatics';
abilityNameMap[toUnifiedName("Auftreten 1")] = "pf_skillPerform1";
abilityNameMap[toUnifiedName("Auftreten 2")] = "pf_skillPerform2";
abilityNameMap[toUnifiedName("Beruf 1")] = "pf_skillProfession1";
abilityNameMap[toUnifiedName("Beruf 2")] = "pf_skillProfession2";
abilityNameMap[toUnifiedName("Bluffen")] = "pf_skillBluff";
abilityNameMap[toUnifiedName("Diplomatie")] = "pf_skillDiplomacy";
abilityNameMap[toUnifiedName("Einschüchtern")] = "pf_skillIntimidate";
abilityNameMap[toUnifiedName("Entfesselungskunst")] = "pf_skillEscapeArtist";
abilityNameMap[toUnifiedName("Fingerfertigkeit")] = "pf_skillSleightOfHand";
abilityNameMap[toUnifiedName("Fliegen")] = "pf_skillFly";
abilityNameMap[toUnifiedName("Handwerk 1")] = "pf_skillCraft1";
abilityNameMap[toUnifiedName("Handwerk 2")] = "pf_skillCraft2";
abilityNameMap[toUnifiedName("Handwerk 3")] = "pf_skillCraft3";
abilityNameMap[toUnifiedName("Heilkunde")] = "pf_skillHeal";
abilityNameMap[toUnifiedName("Heimlichkeit")] = "pf_skillStealth";
abilityNameMap[toUnifiedName("Klettern")] = "pf_skillClimb";
abilityNameMap[toUnifiedName("Magischen Gegenstand benutzen")] = "pf_skillUseMagicDevice";
abilityNameMap[toUnifiedName("Mechanismus ausschalten")] = "pf_skillDisableDevice";
abilityNameMap[toUnifiedName("Mit Tieren umgehen")] = "pf_skillHandleAnimal";
abilityNameMap[toUnifiedName("Motiv erkennen")] = "pf_skillSenseMotive";
abilityNameMap[toUnifiedName("Reiten")] = "pf_skillRide";
abilityNameMap[toUnifiedName("Schätzen")] = "pf_skillAppraise";
abilityNameMap[toUnifiedName("Schwimmen")] = "pf_skillSwim";
abilityNameMap[toUnifiedName("Sprachenkunde")] = "pf_skillLinguistics";
abilityNameMap[toUnifiedName("Überlebenskunst")] = "pf_skillSurvival";
abilityNameMap[toUnifiedName("Verkleiden")] = "pf_skillDisguise";
abilityNameMap[toUnifiedName("Wahrnehmung")] = "pf_skillPerception";
abilityNameMap[toUnifiedName("Wissen (Adel)")] = "pf_skillKnowledgeNobility";
abilityNameMap[toUnifiedName("Wissen (Arkanes)")] = "pf_skillKnowledgeArcana";
abilityNameMap[toUnifiedName("Wissen (Baukunst)")] = "pf_skillKnowledgeEngineering";
abilityNameMap[toUnifiedName("Wissen (Ebenen)")] = "pf_skillKnowledgePlanes";
abilityNameMap[toUnifiedName("Wissen (Die Ebenen)")] = "pf_skillKnowledgePlanes";
abilityNameMap[toUnifiedName("Wissen (Geographie)")] = "pf_skillKnowledgeGeography";
abilityNameMap[toUnifiedName("Wissen (Geschichte)")] = "pf_skillKnowledgeHistory";
abilityNameMap[toUnifiedName("Wissen (Gewölbe)")] = "pf_skillKnowledgeDungeoneering";
abilityNameMap[toUnifiedName("Wissen (Gewölbekunde)")] = "pf_skillKnowledgeDungeoneering";
abilityNameMap[toUnifiedName("Wissen (Lokales)")] = "pf_skillKnowledgeLocal";
abilityNameMap[toUnifiedName("Wissen (Natur)")] = "pf_skillKnowledgeNature";
abilityNameMap[toUnifiedName("Wissen (Religion)")] = "pf_skillKnowledgeReligion";
abilityNameMap[toUnifiedName("Zauberkunde")] = "pf_skillSpellcraft";

function createBaseSection(entry) {
    // find values
    var perception = 0;
    for(const abilityObject of entry['Fertigkeiten']) {
        if(abilityObject['Name'] == 'Wahrnehmung') {
            perception = abilityObject['Wert'];
        }
    }

    // build string
    var sb = '<p>';

    // EP <value>
    sb += `<strong>EP ${entry['EP'].toLocaleString()}</strong><br>`;

    // [class?]
    if(entry['Art']['Klasse']) sb += `${entry['Art']['Klasse']}<br>`;

    // <alignment> <size> <type>
    sb += `${entry['Gesinnung']} ${entry['Art']['Größe']} ${getStringWithNotes(entry['Art']['Art'], entry['Art']['Unterart'], true)}<br>`;

    // INI <annotatedValue>; Sinne <commaSepValues>; Wahrnehmung <value>
    sb += `<strong>INI</strong> ${getStringWithNotes(getSigned(entry['Initiative']['Wert']), entry['Initiative']['Anmerkung'], true)}`;
    if(entry['Sinne'].length > 0) sb += `; <strong>Sinne</strong> ${getCombinedString(entry['Sinne'], false)}`;
    sb += `; Wahrnehmung ${getSigned(perception)}<br>`;

    // [Aura <commaSepValues>]
    if(entry['Auren'].length > 0) sb += `<strong>Aura</strong> ${getCombinedString(entry['Auren'], false)}`;

    sb += '</p>';

    return sb;
}

function createDefenseSection(entry) {
    // build string
    var sb = '<hr><strong>VERTEIDIGUNG:</strong><hr>';
    sb += '<p>';

    // RK <value>, Berührung <value>, auf dem falschen Fuß <value> (<modifiers>; <notes>)
    sb += `<strong>RK</strong> ${entry['RK']['Normal']}, <strong>Berührung</strong> ${entry['RK']['Berührung']}, <strong>auf dem falschen Fuß</strong> ${entry['RK']['AufDemFalschenFuß']} (`;
    for(var i=0; i<entry['RK']['Modifikatoren'].length; i++) {
        if(i > 0) sb += ', ';

        sb += `${entry['RK']['Modifikatoren'][i]['Name']} ${getSigned(entry['RK']['Modifikatoren'][i]['Wert'])}`;
    }
    if(entry['RK']['Anmerkung']) sb += `; ${entry['RK']['Anmerkung']}`;
    sb += ')<br>';

    // TP <value> (<tw>)[; <notes>]
    sb += `<strong>TP</strong> ${getStringWithNotes(entry['TP']['Wert'], entry['TP']['TW'], true)}`;
    if(entry['TP']['Anmerkung']) sb += `; ${entry['TP']['Anmerkung']}`;
    sb += '<br>';

    //  REF <value>, WIL <value>, ZÄH <value>; <notes>
    sb += `<strong>REF</strong> ${getStringWithNotes(getSigned(entry['Rettungswürfe']['Reflex']['Wert']), entry['Rettungswürfe']['Reflex']['Anmerkung'], true)}, `;
    sb += `<strong>WIL</strong> ${getStringWithNotes(getSigned(entry['Rettungswürfe']['Willen']['Wert']), entry['Rettungswürfe']['Willen']['Anmerkung'], true)}, `;
    sb += `<strong>ZÄH</strong> ${getStringWithNotes(getSigned(entry['Rettungswürfe']['Zähigkeit']['Wert']), entry['Rettungswürfe']['Zähigkeit']['Anmerkung'], true)}`;
    if(entry['Rettungswürfe']['Anmerkungen']) sb += `; ${entry['Rettungswürfe']['Anmerkungen']}`;
    sb += '<br>';

    // [[Immunitäten;] Resistenzen]
    if(entry['Verteidigung']['Immunitäten'].length > 0) {
        sb += `<strong>Immunitäten</strong> ${getCombinedString(entry['Verteidigung']['Immunitäten'], false)}`;
        if(entry['Verteidigung']['Resistenzen'].length > 0) {
            sb += `; <strong>Resistenzen</strong> ${getCombinedString(entry['Verteidigung']['Resistenzen'], false)}`;
        }
        sb += '<br>';
    } else if(entry['Verteidigung']['Resistenzen'].length > 0) {
        sb += `<strong>Resistenzen</strong> ${getCombinedString(entry['Verteidigung']['Resistenzen'], false)}`;
        sb += '<br>';
    }
    
    // [[SR;] ZR]
    if(entry['Verteidigung']['SR'].length > 0) {
        sb += `<strong>SR</strong> ${getCombinedString(entry['Verteidigung']['SR'], false)}`;
        if(entry['Verteidigung']['ZR']['Wert']) {
            sb += `; <strong>ZR</strong> ${getStringWithNotes(entry['Verteidigung']['ZR']['Wert'], entry['Verteidigung']['ZR']['Anmerkung'], true)}`;
        }
        sb += '<br>';
    } else if(entry['Verteidigung']['ZR']['Wert']) {
        sb += `; <strong>ZR</strong> ${getStringWithNotes(entry['Verteidigung']['ZR']['Wert'], entry['Verteidigung']['ZR']['Anmerkung'], true)}`;
        sb += '<br>';
    }

    // [Verteidigungsfähigkeiten]
    if(entry['Verteidigung']['Verteidigungsfähigkeiten'].length > 0) {
        sb += `<strong>Verteidigungsfähigkeiten</strong> ${getCombinedString(entry['Verteidigung']['Verteidigungsfähigkeiten'], false)}<br>`;
    }

    // [Schwächen]
    if(entry['Verteidigung']['Schwächen'].length > 0) {
        sb += `<strong>Schwächen</strong> ${getCombinedString(entry['Verteidigung']['Schwächen'], false)}<br>`;
    }

    sb += '</p>';
    return sb;
}

// Bewegungsrate <annotatedValue>[, Fliegen <annotatedValue>][, Schwimmen <annotatedValue>][, Klettern <annotatedValue>][, Graben <annotatedValue>][; <movementAbilities>]
// [Nahkampf <commaSepAttacks>]
// [Fernkampf <commaSepAttacks>]
// [Angriffsfläche <value>; Reichweite <annotatedValue>]
// [Besondere Angriffe <commaSepAnnotatedValues>]
// [Zauberähnliche Fähigkeiten/Bekannte Zauber/... (ZS <value>[; Konzentration <value>])]
//     REPEATED: <grad+usage> - <commaSepAnnotatedValues>
//     [* <notes>]
// [...]
function createAttackSection(entry) {
    // build string
    var sb = '<hr><strong>ANGRIFF:</strong><hr>';
    sb += '<p>';

    // Bewegungsrate <annotatedValue>[, Fliegen <annotatedValue>][, Schwimmen <annotatedValue>][, Klettern <annotatedValue>][, Graben <annotatedValue>][; <movementAbilities>]
    var br = '';
    for(var type of ['Normal', 'Fliegen', 'Schwimmen', 'Klettern', 'Graben']) {
        const brEntry = entry['Bewegungsraten'][type];
        if(brEntry) {
            if(br) br += ', ';
            if(type != 'Normal') br += `${type} `;
            br += `${getStringWithNotes(brEntry['Wert']+' m', brEntry['Anmerkung'], true)}`;
        }
    }
    if(entry['Bewegungsraten']['Fähigkeiten']) br += `; ${entry['Bewegungsraten']['Fähigkeiten']}`;
    sb += `<strong>Bewegungsrate</strong> ${br}<br>`;

    // [Nahkampf <commaSepAttacks>]
    // [Fernkampf <commaSepAttacks>]
    for(var type of ['Nahkampf', 'Fernkampf']) {
        const atEntry = entry['Angriff'][type];
        if(atEntry) {
            var at = '';
            for(const attack of atEntry) {
                if(at) at += ', ';

                if(attack['Anzahl'] > 1) at += `${attack['Anzahl']} `;
                at += attack['Name'];
                if(attack['Berührung']) at += ' Berührung';
                
                var mods = '';
                for(var mod of attack['Modifikatoren']) {
                    if(mods) mods += '/';
                    mods += getSigned(mod);
                }
                at += ` ${mods} (${attack['SchadenUndEffekte']})`;
            }
            sb += `<strong>${type}</strong> ${at}<br>`;
        }
    }

    // [Angriffsfläche <value>; Reichweite <annotatedValue>]
    if(entry['Angriff']['Angriffsfläche']) {
        sb += `<strong>Angriffsfläche</strong> ${getStringWithNotes(entry['Angriff']['Angriffsfläche']['Wert']+' m', entry['Angriff']['Angriffsfläche']['Anmerkung'], true)}`;
        if(entry['Angriff']['Reichweite']) sb += `; <strong>Reichweite</strong> ${getStringWithNotes(entry['Angriff']['Reichweite']['Wert']+' m', entry['Angriff']['Reichweite']['Anmerkung'], true)}`;
        sb += '<br>';
    }

    // [Besondere Angriffe <commaSepAnnotatedValues>]
    if(entry['Angriff']['BesondereAngriffe']) {
        var at = '';
        for(const attack of entry['Angriff']['BesondereAngriffe']) {
            if(at) at += ', ';
            at += `${getStringWithNotes(attack['Wert'], attack['Anmerkung'] , true)}`;
        }
        sb += `<strong>Besondere Angriffe</strong> ${at}<br>`;
    }

    // [Zauberähnliche Fähigkeiten/Bekannte Zauber/... (ZS <value>[; Konzentration <value>])]
    //     REPEATED: <grad+usage> - <commaSepAnnotatedValues>
    //     [* <notes>]
    for(var spellList of entry['Zauberlisten']) {
        sb += `<strong>${spellList['Name']}</strong>`;
        if(spellList['ZS']) {
            sb += ` (ZS ${spellList['ZS']}`;
            if(spellList['Konzentration']) sb += `; Konzentration ${getSigned(spellList['Konzentration'])}`;
            sb += ')<br>';
        }

        for(var spellListEntry of spellList['Einträge']) {
            var sl = '';
            for(var spell of spellListEntry['Zauber']) {
                if(sl) sl += ', ';
                sl += `${getStringWithNotes(spell['Wert'], spell['Anmerkung'], true)}`;
            }
            sb += `${spellListEntry['GradUndLimits']} - ${sl}<br>`;
        }
    }

    // [...]
    for(var annotation of entry['Angriff']['Anmerkungen']) {
        sb += `<strong>${annotation['Wert']}</strong> ${annotation['Anmerkung']}`;
    }

    sb += '</p>';
    return sb;
}

function createValuesSection(entry) {
    // build string
    var sb = '<hr><strong>SPIELWERTE:</strong><hr>';
    sb += '<p>';

    // ST <value>, GE <value>, KO <value>, IN <value>, WE <value>, CH <value>
    sb += `<strong>ST</strong> ${entry['Attribute']['Stärke']}, `;
    sb += `<strong>GE</strong> ${entry['Attribute']['Geschicklichkeit']}, `;
    sb += `<strong>KO</strong> ${entry['Attribute']['Konstitution']}, `;
    sb += `<strong>IN</strong> ${entry['Attribute']['Intelligenz']}, `;
    sb += `<strong>WE</strong> ${entry['Attribute']['Weisheit']}, `;
    sb += `<strong>CH</strong> ${entry['Attribute']['Charisma']}<br>`;

    // GAB <value>; KMB <annotatedValue>; KMV <annotatedValue>
    sb += `<strong>GAB</strong> ${getSigned(entry['GAB'])}; `;
    sb += `<strong>KMB</strong> ${getStringWithNotes(getSigned(entry['KMB']['Wert']), entry['KMB']['Anmerkung'], true)}; `;
    sb += `<strong>KMV</strong> ${getStringWithNotes(getSigned(entry['KMV']['Wert']), entry['KMV']['Anmerkung'], true)}<br>`;
    
    // [Talente <commaSepValues>]
    sb += `<strong>Talente</strong> ${getCombinedString(entry['Talente'], false)}<br>`;

    // [Fertigkeiten <commaSepValues>[; Volksmodifikatoren <commaSepValues>]]
    if(entry['Fertigkeiten'].length > 0) {
        sb += '<strong>Fertigkeiten</strong> ';
        for(var i=0; i<entry['Fertigkeiten'].length; i++) {
            if(i > 0) sb += ', ';

            sb += `${entry['Fertigkeiten'][i]['Name']} ${getStringWithNotes(getSigned(entry['Fertigkeiten'][i]['Wert']), entry['Fertigkeiten'][i]['Anmerkung'], true)}`;
        }
        if(entry['Volksmodifikatoren'].length > 0) {
            sb += `; <strong>Volksmodifikatoren</strong> ${getCombinedString(entry['Volksmodifikatoren'], false)}`;
        }
        sb += '<br>';
    }

    // [Sprachen <commaSepValues>[; <commaSepValues>]]
    if(entry['Sprachen'].length > 0) {
        sb += `<strong>Sprachen</strong> ${getCombinedString(entry['Sprachen'], false)}`;
        if(entry['Sprachzauber'].length > 0) {
            sb += `; ${getCombinedString(entry['Sprachzauber'], false)}`;
        }
        sb += '<br>';
    }

    // [Besondere Eigenschaften <commaSepValues>]
    if(entry['BesondereEigenschaften'].length > 0) {
        sb += `<strong>Besondere Eigenschaften</strong> ${getCombinedString(entry['BesondereEigenschaften'], false)}<br>`;
    }
    
    sb += '</p>';
    return sb;
}

function createEcologySection(entry) {
    if(!entry['Lebensweise']) return '';

    // build string
    var sb = '<hr><strong>LEBENSWEISE:</strong><hr>';
    sb += '<p>';

    // Umgebung <value>
    sb += `<strong>Umgebung</strong> ${entry['Lebensweise']['Umgebung']}<br>`;

    // Organisation <value>
    sb += `<strong>Organisation</strong> ${entry['Lebensweise']['Organisation']}<br>`;
    
	// Schätze <value>
    sb += `<strong>Schätze</strong> ${entry['Lebensweise']['Schätze']}<br>`;
    
    sb += '</p>';
    return sb;
}

function createSpecialAbilitiesSection(entry) {
    if(entry['BesondereFähigkeiten'].length == 0) return '';

    // build string
    var sb = '<hr><strong>BESONDERE FÄHIGKEITEN:</strong><hr>';
    sb += '<p>';

    for(const specialAbility of entry['BesondereFähigkeiten']) {
        sb += `<strong>${specialAbility['Name']} (${specialAbility['Art']})</strong> ${specialAbility['Beschreibung'].replace('\n', '<br>')}<br><br>`;
    }
    
    sb += '</p>';
    return sb;
}