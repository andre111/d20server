import { getCombinedString, getSigned, getStringWithNotes } from './generator-utils.js';
import { getTalentID, getZauberID, toUnifiedName } from './generator.js';
import { Entity } from '../core/common/common.js';

import fs from 'fs-extra';

export function createActor(entry, monsterIcons) {
    // get basic info
    const name = entry['Name'];
    const hgString = entry['HG'] ? (entry['HG'].length < 2 ? '0' + entry['HG'] : entry['HG']) : '?';

    // create entity
    const monsterActor = new Entity('actor');

    // apply properties
    monsterActor.setString('name', name);
    monsterActor.setString('path', `Monster/HG ${hgString}/`);
    monsterActor.setString('pf_alignment', entry['Gesinnung']);
    monsterActor.setString('pf_class', entry['Art']['Klasse']);
    monsterActor.setString('pf_race', getStringWithNotes(entry['Art']['Art'], entry['Art']['Unterart'], true));

    monsterActor.setLong('pf_str', entry['Attribute']['Stärke']);
    monsterActor.setLong('pf_dex', entry['Attribute']['Geschicklichkeit']);
    monsterActor.setLong('pf_con', entry['Attribute']['Konstitution']);
    monsterActor.setLong('pf_int', entry['Attribute']['Intelligenz']);
    monsterActor.setLong('pf_wis', entry['Attribute']['Weisheit']);
    monsterActor.setLong('pf_cha', entry['Attribute']['Charisma']);

    monsterActor.setLong('pf_hp', entry['TP']['Wert']);
    monsterActor.setLong('pf_hpMax', entry['TP']['Wert']);

    monsterActor.setLong('pf_baseAttackBonus', entry['GAB']);

    const currentInit = monsterActor.getLong('pf_initMod');
    const targetInit = entry['Initiative']['Wert'];
    monsterActor.setLong('pf_initMiscMod', targetInit - currentInit);

    monsterActor.setLong('pf_spellResistance', entry['Verteidigung']['ZR']['Wert']);

    // armor class //TODO: check against provided value
    var acArmorBonus = 0;
    var acShieldBonus = 0;
    var acSizeMod = 0;
    var acNaturalArmor = 0;
    var acDeflectionMod = 0;
    var acMiscMod = 0;
    const acModArray = entry['RK']['Modifikatoren'];
    for (const acModObject of acModArray) {
        switch (acModObject['Typ']) {
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
            case 'Ausweichen':
                acDeflectionMod += acModObject['Wert'];
                break;
            case 'Ablenkung':
            case 'Sonstige':
                acMiscMod += acModObject['Wert'];
                break;
            default:
                throw new Error(`Unknown AC Mod: ${acModObject['Typ']}`);
        }
    }

    monsterActor.setLong('pf_acArmorBonus', acArmorBonus);
    monsterActor.setLong('pf_acShieldBonus', acShieldBonus);
    monsterActor.setLong('pf_acSizeMod', acSizeMod);
    monsterActor.setLong('pf_acNaturalArmor', acNaturalArmor);
    monsterActor.setLong('pf_acDeflectionMod', acDeflectionMod);
    monsterActor.setLong('pf_acMiscMod', acMiscMod);
    monsterActor.setLong('pf_sizeMod', -acSizeMod);

    // saves
    const currentSaveReflex = monsterActor.getLong('pf_saveReflex');
    const targetSaveReflex = entry['Rettungswürfe']['Reflex']['Wert'];
    monsterActor.setLong('pf_saveReflexBase', targetSaveReflex - currentSaveReflex);
    const currentSaveWill = monsterActor.getLong('pf_saveWill');
    const targetSaveWill = entry['Rettungswürfe']['Willen']['Wert'];
    monsterActor.setLong('pf_saveWillBase', targetSaveWill - currentSaveWill);
    const currentSaveFortitude = monsterActor.getLong('pf_saveFortitude');
    const targetSaveFortitude = entry['Rettungswürfe']['Zähigkeit']['Wert'];
    monsterActor.setLong('pf_saveFortitudeBase', targetSaveFortitude - currentSaveFortitude);

    // abilities
    var auftretenIndex = 1;
    var berufIndex = 1;
    var handwerkIndex = 1;
    for (const abilityObject of entry['Fertigkeiten']) {
        const abilityFullName = abilityObject['Name'];
        var abilityName = toUnifiedName(abilityFullName);
        var abilityText = '';
        if (abilityName.startsWith('auftreten')) { abilityText = abilityFullName.substring(abilityFullName.indexOf('(') + 1, abilityFullName.length - 1); abilityName = 'auftreten' + (auftretenIndex++); }
        if (abilityName.startsWith('beruf')) { abilityText = abilityFullName.substring(abilityFullName.indexOf('(') + 1, abilityFullName.length - 1); abilityName = 'beruf' + (berufIndex++); }
        if (abilityName.startsWith('handwerk')) { abilityText = abilityFullName.substring(abilityFullName.indexOf('(') + 1, abilityFullName.length - 1); abilityName = 'handwerk' + (handwerkIndex++); }

        if (abilityNameMap[abilityName]) {
            monsterActor.setBoolean(abilityNameMap[abilityName] + 'Class', true);
            const currentAbilityValue = monsterActor.getLong(abilityNameMap[abilityName]);
            const targetAbilityValue = abilityObject['Wert'];
            monsterActor.setLong(abilityNameMap[abilityName] + 'Misc', targetAbilityValue - currentAbilityValue);
            if (abilityText) monsterActor.setString(abilityNameMap[abilityName] + 'Text', abilityText);
        } else {
            console.error(`${name}: Skipping unknown ability: ${abilityFullName}`);
        }
    }

    // sight
    for (const sense of entry['Sinne']) {
        if (sense == 'Dämmersicht') {
            monsterActor.setDouble('lightBrightMult', 2);
            monsterActor.setDouble('lightDimMult', 2);
        } else if (sense.startsWith('Dunkelsicht')) {
            const distM = sense.replace('Dunkelsicht', '').replace('m', '').trim();
            const dist = Number(distM) / 1.5;
            monsterActor.setDouble('sightDark', dist);
        }
    }

    // bio //TODO: complete parsing and restoring of the remaining sections
    monsterActor.setString('bio', entry['Beschreibung']);

    var gmBio = '';
    gmBio += createBaseSection(entry) + '<p>&nbsp;</p>';
    gmBio += createDefenseSection(entry) + '<p>&nbsp;</p>';
    gmBio += createAttackSection(entry) + '<p>&nbsp;</p>';
    gmBio += createValuesSection(entry) + '<p>&nbsp;</p>';
    gmBio += createEcologySection(entry) + '<p>&nbsp;</p>';
    gmBio += createSpecialAbilitiesSection(entry) + '<p>&nbsp;</p>';
    gmBio += '<h6>BESCHREIBUNG:</h6>';
    for (const descParagraph of entry['GMBeschreibung'].split('\n')) {
        gmBio += '<p>';
        gmBio += descParagraph;
        gmBio += '</p>';
    }
    gmBio += '<p>';
    gmBio += `${entry['Regelwerk']} - Seite ${entry['Seite']}`;
    gmBio += '</p>';
    monsterActor.setString('gmBio', gmBio);

    // attachments
    var attachmentList = [];
    {
        // feats
        for (const talent of entry['Talente']) {
            const talentID = getTalentID(talent);

            if (talentID == -1) {
                console.error(`${name}: Skipping unknown talent: ${talent}`);
                continue;
            }

            attachmentList.push(talentID);
        }

        // spells
        for (const zauberListe of entry['Zauberlisten']) {
            for (const zauberEntry of zauberListe['Einträge']) {
                for (const zauber of zauberEntry['Zauber']) {
                    const zauberID = getZauberID(zauber['Wert']);

                    // try to find the matching spell
                    if (zauberID == -1) {
                        console.error(`${name}: Skipping unknown spell: ${zauber['Wert']}`);
                        continue;
                    }

                    attachmentList.push(zauberID);
                }
            }
        }
    }
    monsterActor.setLongList('attachments', attachmentList);

    // create attack macros
    var macros = {};
    for (var type of ['Nahkampf', 'Fernkampf']) {
        const atEntry = entry['Angriff'][type];
        if (atEntry) {
            for (const attackList of atEntry) {
                for (const attack of attackList) {
                    var macro = '';
                    for (var i = 0; i < attack['Anzahl']; i++) {
                        const critRange = attack['KritischWert'] < 20 ? `cs>=${attack['KritischWert']}` : '';
                        const modCount = attack['Modifikatoren'].length;
                        const adjustedFormula = attack['Formel'].replace(/[\[\]]/g, '"'); // change dice type declaration from [...] to "..." for parser syntax
                        for (var m = 0; m < modCount; m++) {
                            macro += `/template attack21 ${attack['Name']};${(attack['Berührung'] ? 'Berührung' : '') + (modCount > 1 ? ` ${m + 1}. Angriff ` : '')};Angriff;1d20${critRange}+${attack['Modifikatoren'][m]}+sActor.modAttack;Schaden;${adjustedFormula}+sActor.modDamage;${attack['SchadenUndEffekte']}\n`;
                        }
                    }

                    var macroName = type + ' - ';
                    if (attack['Anzahl'] > 1) macroName += `${attack['Anzahl']} `;
                    macroName += attack['Name'];

                    macros[macroName] = macro;
                }
            }
        }
    }
    monsterActor.setStringMap('macros', macros);

    // image
    var imagePath = 'tokens/unknown.png';
    if (monsterIcons[name]) imagePath = monsterIcons[name];
    if (monsterIcons[name] && !fs.existsSync('./generated/files/image/' + monsterIcons[name])) throw new Error(`Monster ${name} has broken image path: ${monsterIcons[name]}`);
    if (imagePath) imagePath = '/image/' + imagePath;

    if (imagePath) {
        monsterActor.setString('imagePath', imagePath);
        monsterActor.setString('tokenImagePath', imagePath);
    }

    // token size
    var sizeMult = 1;
    if (acSizeMod >= 1) sizeMult = 0.5;
    if (acSizeMod <= -1) sizeMult = 2;
    if (acSizeMod <= -2) sizeMult = 3;
    if (acSizeMod <= -4) sizeMult = 4;
    if (acSizeMod <= -8) sizeMult = 5;
    monsterActor.setLong('tokenWidth', monsterActor.getLong('tokenWidth') * sizeMult);
    monsterActor.setLong('tokenHeight', monsterActor.getLong('tokenHeight') * sizeMult);

    //TODO: verify calculated values match expected results: ac, acTouch, acFlatFooted, cmb, cmd
    //TODO: specifically cmb and cmd seem like they cannot simply be calculated correctly in all cases

    return monsterActor;
}
function createBaseSection(entry) {
    // find values
    var perception = 0;
    for (const abilityObject of entry['Fertigkeiten']) {
        if (abilityObject['Name'] == 'Wahrnehmung') {
            perception = abilityObject['Wert'];
        }
    }

    // build string
    var sb = '<p>';

    // EP <value>
    sb += `<strong>EP ${entry['EP'].toLocaleString()}</strong><br>`;

    // [class?]
    if (entry['Art']['Klasse']) sb += `${entry['Art']['Klasse']}<br>`;

    // <alignment> <size> <type>
    sb += `${entry['Gesinnung']} ${entry['Art']['Größe']} ${getStringWithNotes(entry['Art']['Art'], entry['Art']['Unterart'], true)}<br>`;

    // INI <annotatedValue>; Sinne <commaSepValues>; Wahrnehmung <value>
    sb += `<strong>INI</strong> ${getStringWithNotes(getSigned(entry['Initiative']['Wert']), entry['Initiative']['Anmerkung'], true)}`;
    if (entry['Sinne'].length > 0) sb += `; <strong>Sinne</strong> ${getCombinedString(entry['Sinne'], false)}`;
    sb += `; Wahrnehmung ${getSigned(perception)}<br>`;

    // [Aura <commaSepValues>]
    if (entry['Auren'].length > 0) sb += `<strong>Aura</strong> ${getCombinedString(entry['Auren'], false)}`;

    sb += '</p>';

    return sb;
}

function createDefenseSection(entry) {
    // build string
    var sb = '<h6>VERTEIDIGUNG:</h6>';
    sb += '<p>';

    // RK <value>, Berührung <value>, auf dem falschen Fuß <value> (<modifiers>; <notes>)
    sb += `<strong>RK</strong> ${entry['RK']['Normal']}, <strong>Berührung</strong> ${entry['RK']['Berührung']}, <strong>auf dem falschen Fuß</strong> ${entry['RK']['AufDemFalschenFuß']} (`;
    for (var i = 0; i < entry['RK']['Modifikatoren'].length; i++) {
        if (i > 0) sb += ', ';

        sb += `${entry['RK']['Modifikatoren'][i]['Name']} ${getSigned(entry['RK']['Modifikatoren'][i]['Wert'])}`;
    }
    if (entry['RK']['Anmerkung']) sb += `; ${entry['RK']['Anmerkung']}`;
    sb += ')<br>';

    // TP <value> (<tw>)[; <notes>]
    sb += `<strong>TP</strong> ${getStringWithNotes(entry['TP']['Wert'], entry['TP']['TW'], true)}`;
    if (entry['TP']['Anmerkung']) sb += `; ${entry['TP']['Anmerkung']}`;
    sb += '<br>';

    //  REF <value>, WIL <value>, ZÄH <value>; <notes>
    sb += `<strong>REF</strong> ${getStringWithNotes(getSigned(entry['Rettungswürfe']['Reflex']['Wert']), entry['Rettungswürfe']['Reflex']['Anmerkung'], true)}, `;
    sb += `<strong>WIL</strong> ${getStringWithNotes(getSigned(entry['Rettungswürfe']['Willen']['Wert']), entry['Rettungswürfe']['Willen']['Anmerkung'], true)}, `;
    sb += `<strong>ZÄH</strong> ${getStringWithNotes(getSigned(entry['Rettungswürfe']['Zähigkeit']['Wert']), entry['Rettungswürfe']['Zähigkeit']['Anmerkung'], true)}`;
    if (entry['Rettungswürfe']['Anmerkungen']) sb += `; ${entry['Rettungswürfe']['Anmerkungen']}`;
    sb += '<br>';

    // [[Immunitäten;] Resistenzen]
    if (entry['Verteidigung']['Immunitäten'].length > 0) {
        sb += `<strong>Immunitäten</strong> ${getCombinedString(entry['Verteidigung']['Immunitäten'], false)}`;
        if (entry['Verteidigung']['Resistenzen'].length > 0) {
            sb += `; <strong>Resistenzen</strong> ${getCombinedString(entry['Verteidigung']['Resistenzen'], false)}`;
        }
        sb += '<br>';
    } else if (entry['Verteidigung']['Resistenzen'].length > 0) {
        sb += `<strong>Resistenzen</strong> ${getCombinedString(entry['Verteidigung']['Resistenzen'], false)}`;
        sb += '<br>';
    }

    // [[SR;] ZR]
    if (entry['Verteidigung']['SR'].length > 0) {
        sb += `<strong>SR</strong> ${getCombinedString(entry['Verteidigung']['SR'], false)}`;
        if (entry['Verteidigung']['ZR']['Wert']) {
            sb += `; <strong>ZR</strong> ${getStringWithNotes(entry['Verteidigung']['ZR']['Wert'], entry['Verteidigung']['ZR']['Anmerkung'], true)}`;
        }
        sb += '<br>';
    } else if (entry['Verteidigung']['ZR']['Wert']) {
        sb += `; <strong>ZR</strong> ${getStringWithNotes(entry['Verteidigung']['ZR']['Wert'], entry['Verteidigung']['ZR']['Anmerkung'], true)}`;
        sb += '<br>';
    }

    // [Verteidigungsfähigkeiten]
    if (entry['Verteidigung']['Verteidigungsfähigkeiten'].length > 0) {
        sb += `<strong>Verteidigungsfähigkeiten</strong> ${getCombinedString(entry['Verteidigung']['Verteidigungsfähigkeiten'], false)}<br>`;
    }

    // [Schwächen]
    if (entry['Verteidigung']['Schwächen'].length > 0) {
        sb += `<strong>Schwächen</strong> ${getCombinedString(entry['Verteidigung']['Schwächen'], false)}<br>`;
    }

    sb += '</p>';
    return sb;
}

// Bewegungsrate <annotatedValue>[, Fliegen <annotatedValue>][, Schwimmen <annotatedValue>][, Klettern <annotatedValue>][, Graben <annotatedValue>][; <movementAbilities>]
// [Nahkampf <commaAndOrSepAttacks>]
// [Fernkampf <commaAndOrSepAttacks>]
// [Angriffsfläche <value>; Reichweite <annotatedValue>]
// [Besondere Angriffe <commaSepAnnotatedValues>]
// [Zauberähnliche Fähigkeiten/Bekannte Zauber/... (ZS <value>[; Konzentration <value>])]
//     REPEATED: <grad+usage> - <commaSepAnnotatedValues>
//     [* <notes>]
// [...]
function createAttackSection(entry) {
    // build string
    var sb = '<h6>ANGRIFF:</h6>';
    sb += '<p>';

    // Bewegungsrate <annotatedValue>[, Fliegen <annotatedValue>][, Schwimmen <annotatedValue>][, Klettern <annotatedValue>][, Graben <annotatedValue>][; <movementAbilities>]
    var br = '';
    for (var type of ['Normal', 'Fliegen', 'Schwimmen', 'Klettern', 'Graben']) {
        const brEntry = entry['Bewegungsraten'][type];
        if (brEntry) {
            if (br) br += ', ';
            if (type != 'Normal') br += `${type} `;
            br += `${getStringWithNotes(brEntry['Wert'] + ' m', brEntry['Anmerkung'], true)}`;
        }
    }
    if (entry['Bewegungsraten']['Fähigkeiten']) br += `; ${entry['Bewegungsraten']['Fähigkeiten']}`;
    sb += `<strong>Bewegungsrate</strong> ${br}<br>`;

    // [Nahkampf <commaAndOrSepAttacks>]
    // [Fernkampf <commaAndOrSepAttacks>]
    for (var type of ['Nahkampf', 'Fernkampf']) {
        const atEntry = entry['Angriff'][type];
        if (atEntry) {
            var atl = '';
            for (const attackList of atEntry) {
                if (atl) atl += ' oder ';

                var at = ''
                for (const attack of attackList) {
                    if (at) at += ', ';

                    if (attack['Anzahl'] > 1) at += `${attack['Anzahl']} `;
                    at += attack['Name'];
                    if (attack['Berührung']) at += ' Berührung';

                    var mods = '';
                    for (var mod of attack['Modifikatoren']) {
                        if (mods) mods += '/';
                        mods += getSigned(mod);
                    }
                    at += ` ${mods} (${attack['SchadenUndEffekte']})`;
                }
                atl += at;
            }
            sb += `<strong>${type}</strong> ${atl}<br>`;
        }
    }

    // [Angriffsfläche <value>; Reichweite <annotatedValue>]
    if (entry['Angriff']['Angriffsfläche']) {
        sb += `<strong>Angriffsfläche</strong> ${getStringWithNotes(entry['Angriff']['Angriffsfläche']['Wert'] + ' m', entry['Angriff']['Angriffsfläche']['Anmerkung'], true)}`;
        if (entry['Angriff']['Reichweite']) sb += `; <strong>Reichweite</strong> ${getStringWithNotes(entry['Angriff']['Reichweite']['Wert'] + ' m', entry['Angriff']['Reichweite']['Anmerkung'], true)}`;
        sb += '<br>';
    }

    // [Besondere Angriffe <commaSepAnnotatedValues>]
    if (entry['Angriff']['BesondereAngriffe']) {
        var at = '';
        for (const attack of entry['Angriff']['BesondereAngriffe']) {
            if (at) at += ', ';
            at += `${getStringWithNotes(attack['Wert'], attack['Anmerkung'], true)}`;
        }
        sb += `<strong>Besondere Angriffe</strong> ${at}<br>`;
    }

    // [Zauberähnliche Fähigkeiten/Bekannte Zauber/... (ZS <value>[; Konzentration <value>])]
    //     REPEATED: <grad+usage> - <commaSepAnnotatedValues>
    //     [* <notes>]
    for (const spellList of entry['Zauberlisten']) {
        sb += `<strong>${spellList['Name']}</strong>`;
        if (spellList['ZS']) {
            sb += ` (ZS ${spellList['ZS']}`;
            if (spellList['Konzentration']) sb += `; Konzentration ${getSigned(spellList['Konzentration'])}`;
            sb += ')<br>';
        }

        for (const spellListEntry of spellList['Einträge']) {
            var sl = '';
            for (const spell of spellListEntry['Zauber']) {
                if (sl) sl += ', ';

                var spellString = spell['Wert'];
                const spellID = getZauberID(spell['Wert']);
                if (spellID != -1) spellString = `<a href="#" class="internal-link" data-target="attachment:${spellID}">${spell['Wert']}</a>`;

                sl += `${getStringWithNotes(spellString, spell['Anmerkung'], true)}`;
            }
            sb += `${spellListEntry['GradUndLimits']} - ${sl}<br>`;
        }
    }

    // [...]
    for (var annotation of entry['Angriff']['Anmerkungen']) {
        sb += `<strong>${annotation['Wert']}</strong> ${annotation['Anmerkung']}`;
    }

    sb += '</p>';
    return sb;
}

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

function createValuesSection(entry) {
    // build string
    var sb = '<h6>SPIELWERTE:</h6>';
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
    var talentString = '';
    for (const talent of entry['Talente']) {
        if (talentString) talentString += ', ';

        const talentID = getTalentID(talent);
        if (talentID != -1) talentString += `<a href="#" class="internal-link" data-target="attachment:${talentID}">${talent}</a>`;
        else talentString += talent;
    }
    sb += `<strong>Talente</strong> ${talentString}<br>`;

    // [Fertigkeiten <commaSepValues>[; Volksmodifikatoren <commaSepValues>]]
    if (entry['Fertigkeiten'].length > 0) {
        sb += '<strong>Fertigkeiten</strong> ';
        for (var i = 0; i < entry['Fertigkeiten'].length; i++) {
            if (i > 0) sb += ', ';

            sb += `${entry['Fertigkeiten'][i]['Name']} ${getStringWithNotes(getSigned(entry['Fertigkeiten'][i]['Wert']), entry['Fertigkeiten'][i]['Anmerkung'], true)}`;
        }
        if (entry['Volksmodifikatoren'].length > 0) {
            sb += `; <strong>Volksmodifikatoren</strong> ${getCombinedString(entry['Volksmodifikatoren'], false)}`;
        }
        sb += '<br>';
    }

    // [Sprachen <commaSepValues>[; <commaSepValues>]]
    if (entry['Sprachen'].length > 0) {
        sb += `<strong>Sprachen</strong> ${getCombinedString(entry['Sprachen'], false)}`;
        if (entry['Sprachzauber'].length > 0) {
            sb += `; ${getCombinedString(entry['Sprachzauber'], false)}`;
        }
        sb += '<br>';
    }

    // [Besondere Eigenschaften <commaSepValues>]
    if (entry['BesondereEigenschaften'].length > 0) {
        sb += `<strong>Besondere Eigenschaften</strong> ${getCombinedString(entry['BesondereEigenschaften'], false)}<br>`;
    }

    sb += '</p>';
    return sb;
}

function createEcologySection(entry) {
    if (!entry['Lebensweise']) return '';

    // build string
    var sb = '<h6>LEBENSWEISE:</h6>';
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
    if (entry['BesondereFähigkeiten'].length == 0) return '';

    // build string
    var sb = '<h6>BESONDERE FÄHIGKEITEN:</h6>';
    sb += '<p>';

    for (const specialAbility of entry['BesondereFähigkeiten']) {
        sb += `<strong>${specialAbility['Name']} (${specialAbility['Art']})</strong> ${specialAbility['Beschreibung'].replace('\n', '<br>')}<br><br>`;
    }

    sb += '</p>';
    return sb;
}
