// @ts-check
import { LongPropertyEditor } from '../../../core/client/gui/property-editor/long-property-editor.js';
import { StringMapPropertyEditor } from '../../../core/client/gui/property-editor/string-map-property-editor.js';
import { AccessPropertyEditor } from '../../../core/client/gui/property-editor/access-property-editor.js';

import { HTMLStringPropertyEditor } from '../../../core/client/gui/property-editor/special/html-string-property-editor.js';
import { LongListPropertyEditor } from '../../../core/client/gui/property-editor/special/long-list-property-editor.js';
import { ImagePropertyEditor } from '../../../core/client/gui/property-editor/special/image-property-editor.js';
import { StringSelectionPropertyEditor } from '../../../core/client/gui/property-editor/special/string-selection-property-editor.js';

import { Tabs } from '../../../core/client/gui/tabs.js';

import { MessageService } from '../../../core/client/service/message-service.js';
import { SendChatMessage } from '../../../core/common/messages.js';

import { ATTRIBUTES, SAVES, SKILL_LIST } from './character-values.js';
import { DefinitionUtils } from '../../../core/common/util/definitionutil.js';
import { CanvasWindowEditEntity } from '../../../core/client/canvas/window/canvas-window-edit-entity.js';
import { ServerData } from '../../../core/client/server-data.js';
import { Access } from '../../../core/common/constants.js';

export class CanvasWindowEditActor extends CanvasWindowEditEntity {
    constructor(parent, reference) {
        super(parent, reference);
    }

    init() {
        const container = this.content;
        container.className = 'edit-window-container cs-container';

        const accessLevel = this.getReference().getAccessLevel(ServerData.localProfile);

        // build content
        // Header
        const header = document.createElement('div');
        header.className = 'cs-header';
        container.appendChild(header);
        {
            const imageEditor = new ImagePropertyEditor('imagePath');
            imageEditor.container.className = 'cs-image';
            header.appendChild(imageEditor.container);
            this.registerEditor(imageEditor);

            const headerSide = document.createElement('div');
            headerSide.className = 'edit-window-header-side flexrow';

            headerSide.appendChild(this.createStringEditor('name', '', 'Name...', 'cs-name'));
            const classLevelSpan = document.createElement('span');
            classLevelSpan.className = 'cs-class-level flexrow';
            classLevelSpan.appendChild(this.createStringEditor('pf_class', '', 'Klasse...'));
            classLevelSpan.appendChild(document.createTextNode('Level'));
            classLevelSpan.appendChild(this.createLongEditor('pf_level'));
            classLevelSpan.appendChild(document.createTextNode('EP'));
            classLevelSpan.appendChild(this.createLongEditor('pf_experience'));
            headerSide.appendChild(classLevelSpan);

            const headerRow1 = document.createElement('ul');
            headerRow1.className = 'edit-window-header-row flexrow';
            const raceLI = document.createElement('li');
            raceLI.appendChild(this.createStringEditor('pf_race', '', 'Volk...'));
            headerRow1.appendChild(raceLI);
            const alignmentLI = document.createElement('li');
            alignmentLI.appendChild(this.createStringEditor('pf_alignment', '', 'Gesinnung...'));
            headerRow1.appendChild(alignmentLI);
            const sizeLI = document.createElement('li');
            sizeLI.appendChild(this.createStringEditor('pf_sizeCategory'));
            sizeLI.appendChild(this.createLongEditor('pf_sizeMod'));
            headerRow1.appendChild(sizeLI);
            headerSide.appendChild(headerRow1);

            if (Access.matches(Access.CONTROLLING_PLAYER, accessLevel)) {
                const headerRow2 = document.createElement('ul');
                headerRow2.className = 'edit-window-header-row flexrow';
                // hp
                const hpLI = document.createElement('li');
                hpLI.appendChild(document.createTextNode('TP: '));
                hpLI.appendChild(this.createLongEditor('pf_hp'));
                hpLI.appendChild(document.createTextNode('/'));
                hpLI.appendChild(this.createLongEditor('pf_hpMax'));
                headerRow2.appendChild(hpLI);
                // non lethal damage
                const nldLI = document.createElement('li');
                nldLI.appendChild(document.createTextNode('Nicht tödlicher Schaden: '));
                nldLI.appendChild(this.createLongEditor('pf_nonLethalDamage'));
                headerRow2.appendChild(nldLI);
                // BAB
                const babLI = document.createElement('li');
                babLI.appendChild(document.createTextNode('Grundangriffsbonus: '));
                babLI.appendChild(this.createLongEditor('pf_baseAttackBonus'));
                headerRow2.appendChild(babLI);
                //TODO: move some more stuff up here: initiative, bab?
                headerSide.appendChild(headerRow2);
            }

            header.appendChild(headerSide);
        }

        // Content
        const tabs = document.createElement('div');
        tabs.className = 'cs-tabs';
        container.appendChild(tabs);
        //    Attributes
        if (Access.matches(Access.CONTROLLING_PLAYER, accessLevel)) {
            const tab = document.createElement('div');
            tab.dataset.name = 'Attribute';
            tab.style.display = 'flex';
            tabs.appendChild(tab);

            // Attributes
            const attributesUL = createCSListArea(tab, 'cs-attributes', true);
            attributesUL.appendChild(this.createCSAttributeEditor('Stärke', 'str'));
            attributesUL.appendChild(this.createCSAttributeEditor('Geschicklichkeit', 'dex'));
            attributesUL.appendChild(this.createCSAttributeEditor('Konstitution', 'con'));
            attributesUL.appendChild(this.createCSAttributeEditor('Intelligenz', 'int'));
            attributesUL.appendChild(this.createCSAttributeEditor('Weisheit', 'wis'));
            attributesUL.appendChild(this.createCSAttributeEditor('Charisma', 'cha'));


            const otherValuesUL = createCSListArea(tab, 'cs-other-values', true);

            // Ini
            const valueIni = this.createValueContainer('Initiative', () => this.sendMacro('Initiative'));
            const iniSpan = document.createElement('span');
            iniSpan.appendChild(this.createLongEditor('pf_initMod'));
            iniSpan.appendChild(document.createTextNode(' = GE + '));
            iniSpan.appendChild(this.createLongEditor('pf_initMiscMod'));
            valueIni.appendChild(iniSpan);
            otherValuesUL.appendChild(valueIni);

            // AC
            const valueAC = this.createValueContainer('Rüstungsklasse');
            valueAC.appendChild(this.createCSNamedEditor('Wert', new LongPropertyEditor('pf_ac')));

            const acCalcSpan1 = document.createElement('span');
            acCalcSpan1.className = 'cs-ac-calc';
            acCalcSpan1.style.fontSize = '12px';
            acCalcSpan1.appendChild(document.createTextNode('= 10 - Größe + GE (Max: '));
            acCalcSpan1.appendChild(this.createLongEditor('pf_acMaxDexMod'));
            acCalcSpan1.appendChild(document.createTextNode(')'));
            valueAC.appendChild(acCalcSpan1);

            const acCalcSpan2 = document.createElement('span');
            acCalcSpan2.className = 'cs-ac-calc';
            acCalcSpan2.style.fontSize = '12px';
            acCalcSpan2.appendChild(document.createTextNode('+'));
            acCalcSpan2.appendChild(this.createLongEditor('pf_acArmorBonus'));
            acCalcSpan2.appendChild(document.createTextNode('Rüstung +'));
            acCalcSpan2.appendChild(this.createLongEditor('pf_acShieldBonus'));
            acCalcSpan2.appendChild(document.createTextNode('Schild'));
            valueAC.appendChild(acCalcSpan2);

            const acCalcSpan3 = document.createElement('span');
            acCalcSpan3.className = 'cs-ac-calc';
            acCalcSpan3.style.fontSize = '12px';
            acCalcSpan3.appendChild(document.createTextNode('+'));
            acCalcSpan3.appendChild(this.createLongEditor('pf_acNaturalArmor'));
            acCalcSpan3.appendChild(document.createTextNode('Natürliche Rüstung'));
            valueAC.appendChild(acCalcSpan3);

            const acCalcSpan4 = document.createElement('span');
            acCalcSpan4.className = 'cs-ac-calc';
            acCalcSpan4.style.fontSize = '12px';
            acCalcSpan4.appendChild(document.createTextNode('+'));
            acCalcSpan4.appendChild(this.createLongEditor('pf_acDeflectionMod'));
            acCalcSpan4.appendChild(document.createTextNode('Ausweichen'));
            valueAC.appendChild(acCalcSpan4);

            const acCalcSpan5 = document.createElement('span');
            acCalcSpan5.className = 'cs-ac-calc';
            acCalcSpan5.style.fontSize = '12px';
            acCalcSpan5.appendChild(document.createTextNode('+'));
            acCalcSpan5.appendChild(this.createLongEditor('pf_acMiscMod'));
            acCalcSpan5.appendChild(document.createTextNode('Sonstiges'));
            valueAC.appendChild(acCalcSpan5);

            valueAC.appendChild(this.createCSNamedEditor('Berührung', new LongPropertyEditor('pf_acTouch')));
            valueAC.appendChild(this.createCSNamedEditor('Auf dem falschen Fuß', new LongPropertyEditor('pf_acFlatFooted')));
            otherValuesUL.appendChild(valueAC);

            // Saves
            const valueSaves = this.createValueContainer('Rettungswürfe');
            for (const save of SAVES) {
                valueSaves.appendChild(this.createCSNamedEditor(save.display, new LongPropertyEditor('pf_save' + save.name), () => this.sendMacro('Rettungswürfe/' + save.display)));

                const saveCalcSpan = document.createElement('span');
                saveCalcSpan.className = 'cs-save-calc';
                saveCalcSpan.appendChild(document.createTextNode(' = '));
                saveCalcSpan.appendChild(this.createLongEditor('pf_save' + save.name + 'Base'));
                saveCalcSpan.appendChild(document.createTextNode(' + ' + ATTRIBUTES[save.attribute].abr));
                for (const mod of ['Magic', 'Misc', 'Temp']) {
                    saveCalcSpan.appendChild(document.createTextNode(' + '));
                    saveCalcSpan.appendChild(this.createLongEditor('pf_save' + save.name + mod));
                }
                valueSaves.appendChild(saveCalcSpan);
            }
            otherValuesUL.appendChild(valueSaves);

            // CMB
            const valueCMB = this.createValueContainer('Kampfmanöver', () => this.sendMacro('Kampfmanöver'));
            const cmbSpan = document.createElement('span');
            cmbSpan.style.fontSize = '12px';
            cmbSpan.appendChild(this.createLongEditor('pf_cmb'));
            cmbSpan.appendChild(document.createTextNode(' = GAB + ST + Größe'));
            valueCMB.appendChild(cmbSpan);
            otherValuesUL.appendChild(valueCMB);

            // CMD
            const valueCMD = this.createValueContainer('KM-Verteidigung', () => this.sendMacro('KM-Verteidigung'));
            const cmdSpan = document.createElement('span');
            cmdSpan.style.fontSize = '12px';
            cmdSpan.appendChild(this.createLongEditor('pf_cmd'));
            cmdSpan.appendChild(document.createTextNode(' = GAB + ST + Größe + GE + 10'));
            valueCMD.appendChild(cmdSpan);
            otherValuesUL.appendChild(valueCMD);

            // Armor Check Penalty
            const valueSR = this.createValueContainer('Rüstungsmalus');
            valueSR.appendChild(this.createLongEditor('pf_armorCheckPenalty'));
            otherValuesUL.appendChild(valueSR);

            // Skills
            const skillsDiv = createCSArea(tab, 'cs-skills');
            const skillsTable = document.createElement('table');
            skillsDiv.appendChild(skillsTable);
            const skillsHeader = document.createElement('thead');
            skillsHeader.innerHTML = '<tr><th></th><th>Fertigkeit</th><th></th><th></th><th>Ränge</th><th>Mod</th></tr>';
            skillsTable.appendChild(skillsHeader);
            const skillsBody = document.createElement('tbody');
            skillsTable.appendChild(skillsBody);
            for (var i = 0; i < SKILL_LIST.length; i++) {
                skillsBody.appendChild(this.createCSSkillEditor(SKILL_LIST[i], i % 2 == 0));
            }
        }
        //    Biographie
        {
            const tab = document.createElement('div');
            tab.dataset.name = 'Biographie';
            tab.className = 'edit-window-area edit-window-full-area flexrow';
            tabs.appendChild(tab);

            const valuesLI = document.createElement('li');
            valuesLI.className = 'cs-content-sidebar';
            tab.appendChild(valuesLI);
            {
                const valueGender = this.createValueContainer('Geschlecht');
                valueGender.appendChild(this.createStringEditor('pf_gender', '', '...'));
                valuesLI.appendChild(valueGender);

                const valueAge = this.createValueContainer('Alter');
                valueAge.appendChild(this.createStringEditor('pf_age', '', '...'));
                valuesLI.appendChild(valueAge);

                const valueSize = this.createValueContainer('Größe');
                valueSize.appendChild(this.createStringEditor('pf_size', '', '...'));
                valuesLI.appendChild(valueSize);

                const valueWeight = this.createValueContainer('Gewicht');
                valueWeight.appendChild(this.createStringEditor('pf_weight', '', '...'));
                valuesLI.appendChild(valueWeight);

                const valueHairColor = this.createValueContainer('Haarfarbe');
                valueHairColor.appendChild(this.createStringEditor('pf_hairColor', '', '...'));
                valuesLI.appendChild(valueHairColor);

                const valueEyeColor = this.createValueContainer('Augenfarbe');
                valueEyeColor.appendChild(this.createStringEditor('pf_eyeColor', '', '...'));
                valuesLI.appendChild(valueEyeColor);

                const valueDeity = this.createValueContainer('Gottheit / Glauben');
                valueDeity.appendChild(this.createStringEditor('pf_deity', '', '...'));
                valuesLI.appendChild(valueDeity);
            }

            const editor = new HTMLStringPropertyEditor('bio', '');
            editor.container.style.width = 'calc(100% - 200px - 10px)';
            editor.container.style.height = 'calc(100% - 10px)';
            editor.container.style.margin = '5px';
            tab.appendChild(editor.container);
            this.registerEditor(editor);
        }
        //    Talente/Zauber
        if (Access.matches(Access.CONTROLLING_PLAYER, accessLevel)) {
            const tab = document.createElement('div');
            tab.dataset.name = 'Talente/Zauber';
            tab.className = 'edit-window-area edit-window-full-area flexrow';
            tabs.appendChild(tab);

            const valuesLI = document.createElement('li');
            valuesLI.className = 'cs-content-sidebar';
            tab.appendChild(valuesLI);
            {
                const valueSR = this.createValueContainer('Zauberresistenz');
                valueSR.appendChild(this.createLongEditor('pf_spellResistance'));
                valuesLI.appendChild(valueSR);

                //TODO: other spell related values (saves (attribute selection), known spells, ...)
            }

            const editor = new LongListPropertyEditor('attachments', '', 'attachment', false);
            tab.appendChild(editor.container);
            this.registerEditor(editor);
        }
        //    Macros
        if (Access.matches(Access.CONTROLLING_PLAYER, accessLevel)) {
            const tab = document.createElement('div');
            tab.dataset.name = 'Macros';
            tab.className = 'edit-window-area edit-window-full-area flexrow';
            tabs.appendChild(tab);

            const valuesLI = document.createElement('li');
            valuesLI.className = 'cs-content-sidebar cs-macros-sidebar';
            tab.appendChild(valuesLI);
            {
                const valueMods = this.createValueContainer('Modifikatoren');
                const mods = [
                    ['modAttack', 'Angriff'],
                    ['modDamage', 'Schaden'],
                    ['modCritical1', 'Kritisch 1'],
                    ['modCritical2', 'Kritisch 2'],
                    ['modGeneric1', 'Generisch 1'],
                    ['modGeneric2', 'Generisch 2'],
                    ['modGeneric3', 'Generisch 3'],
                    ['modGeneric4', 'Generisch 4'],
                    ['modGeneric5', 'Generisch 5'],
                    ['modGeneric6', 'Generisch 6']
                ];
                for (const mod of mods) {
                    valueMods.appendChild(this.createLongEditor(mod[0], mod[1]));
                }
                valuesLI.appendChild(valueMods);
            }

            const editor = new StringMapPropertyEditor('macros', '');
            editor.container.style.width = '100%';
            editor.container.style.height = '100%';
            tab.appendChild(editor.container);
            this.registerEditor(editor);
        }
        //    GM
        if (Access.matches(Access.GM, accessLevel)) {
            const tab = document.createElement('div');
            tab.dataset.name = 'GM';
            tab.className = 'edit-window-area edit-window-full-area flexrow';
            tabs.appendChild(tab);

            const valuesLI = document.createElement('li');
            valuesLI.className = 'cs-content-sidebar cs-gm-sidebar';
            tab.appendChild(valuesLI);
            {
                const valueName = this.createValueContainer('Listenpfad');
                valueName.appendChild(this.createStringEditor('path'));
                valuesLI.appendChild(valueName);

                const extensionPoint = DefinitionUtils.getExtensionPointForProperty(this.getReference().getDefinition(), 'type');
                var extensions = {};
                for (const [key, value] of Object.entries(extensionPoint.extensionDefinitions)) {
                    extensions[key] = value.displayName;
                }

                const valueType = this.createValueContainer('Typ');
                const typeEditor = new StringSelectionPropertyEditor('type', '', extensions);
                valueType.appendChild(typeEditor.container);
                this.registerEditor(typeEditor);
                valuesLI.appendChild(valueType);

                const valueToken = this.createValueContainer('Token');
                valueToken.className += ' cs-gm-token';
                const tokenSpan = document.createElement('span');
                const imageEditor = new ImagePropertyEditor('tokenImagePath');
                imageEditor.container.className = 'cs-gm-token-image';
                tokenSpan.appendChild(imageEditor.container);
                this.registerEditor(imageEditor);
                tokenSpan.appendChild(this.createLongEditor('tokenWidth', 'Breite'));
                tokenSpan.appendChild(this.createLongEditor('tokenHeight', 'Höhe'));
                valueToken.appendChild(tokenSpan);
                valuesLI.appendChild(valueToken);

                const valueSight = this.createValueContainer('Sicht');
                valueSight.appendChild(this.createCSSightEditor('Bright', true, 'Hell'));
                valueSight.appendChild(this.createCSSightEditor('Dim', true, 'Dämmer'));
                valueSight.appendChild(this.createCSSightEditor('Dark', false, 'Dunkel'));
                valuesLI.appendChild(valueSight);

                const valueAccess = this.createValueContainer('Sichtbarkeit');
                const accessEditor = new AccessPropertyEditor('access', '');
                valueAccess.appendChild(accessEditor.container);
                this.registerEditor(accessEditor);
                valuesLI.appendChild(valueAccess);

                const valuePlayers = this.createValueContainer('Controlling Players');
                const playerEditor = new LongListPropertyEditor('controllingPlayers', '', 'profile', false);
                valuePlayers.appendChild(playerEditor.container);
                this.registerEditor(playerEditor);
                valuesLI.appendChild(valuePlayers);
            }

            const editor = new HTMLStringPropertyEditor('gmBio', '');
            editor.container.style.width = 'calc(100% - 200px - 10px)';
            editor.container.style.height = 'calc(100% - 10px)';
            editor.container.style.margin = '5px';
            tab.appendChild(editor.container);
            this.registerEditor(editor);
        }

        Tabs.init(tabs);
        this.setDimensions(700 + 2, 800 + 35);
        this.showPopoutButton(true);
    }

    sendMacro(name) {
        MessageService.send(new SendChatMessage('!!' + name + '§' + this.getReference().getPath()));
    }

    // Complex Editor Structures
    createCSAttributeEditor(name, propertyAbreviation) {
        const li = document.createElement('li');
        li.className = 'cs-attribute edit-window-value-container';

        const nameP = document.createElement('p');
        nameP.innerText = name;
        nameP.className = 'edit-window-clickable';
        nameP.onclick = () => this.sendMacro('Attributswürfe/' + name);
        li.appendChild(nameP);

        const inputSpan = document.createElement('span');
        li.appendChild(inputSpan);
        {
            inputSpan.appendChild(this.createLongEditor('pf_' + propertyAbreviation, '', 'cs-attribute-value'));
            inputSpan.appendChild(document.createTextNode('±'));
            inputSpan.appendChild(this.createLongEditor('pf_' + propertyAbreviation + 'Temp', '', 'cs-attribute-temp'));
        }

        li.appendChild(this.createLongEditor('pf_' + propertyAbreviation + 'Mod', '', 'cs-attribute-mod'));

        return li;
    }

    createCSSkillEditor(skill, darken) {
        const tr = document.createElement('tr');
        tr.className = 'cs-skill';
        if (darken) tr.style.background = 'rgba(0, 0, 0, 0.05)';

        const classEditorTD = document.createElement('td');
        classEditorTD.appendChild(this.createBooleanEditor('pf_skill' + skill.name + 'Class', ''))
        tr.appendChild(classEditorTD);

        const nameTD = document.createElement('td');
        const nameP = document.createElement('span');
        nameP.innerText = skill.display;
        nameP.className = 'edit-window-clickable';
        nameP.onclick = () => this.sendMacro(skill.macro);
        nameTD.appendChild(nameP);
        if (skill.hasText) {
            nameTD.appendChild(this.createStringEditor('pf_skill' + skill.name + 'Text', '', '...............', 'cs-skill-text'));
        }
        tr.appendChild(nameTD);

        const modTD = document.createElement('td');
        modTD.appendChild(this.createLongEditor('pf_skill' + skill.name));
        tr.appendChild(modTD);

        const attributeTD = document.createElement('td');
        attributeTD.innerText = '= ' + ATTRIBUTES[skill.attribute].abr;
        tr.appendChild(attributeTD);

        const ranksTD = document.createElement('td');
        ranksTD.appendChild(document.createTextNode('+'));
        ranksTD.appendChild(this.createLongEditor('pf_skill' + skill.name + 'Ranks'));
        tr.appendChild(ranksTD);

        const miscTD = document.createElement('td');
        miscTD.appendChild(document.createTextNode('+'));
        miscTD.appendChild(this.createLongEditor('pf_skill' + skill.name + 'Misc'));
        tr.appendChild(miscTD);

        return tr;
    }

    createCSNamedEditor(name, editor, onclick) {
        const span = document.createElement('span');

        const nameP = document.createElement('span');
        nameP.innerText = name;
        if (onclick) {
            nameP.className = 'edit-window-clickable';
            nameP.onclick = onclick;
        }
        span.appendChild(nameP);

        span.appendChild(editor.container);
        this.registerEditor(editor, true);

        return span;
    }

    createCSSightEditor(lightLevel, hasMultiplier, name) {
        const span = document.createElement('span');
        span.className = 'cs-sight-editor';

        span.appendChild(document.createTextNode(name));
        span.appendChild(this.createDoubleEditor('sight' + lightLevel));
        if (hasMultiplier) {
            span.appendChild(document.createTextNode('x'));
            span.appendChild(this.createDoubleEditor('light' + lightLevel + 'Mult'));
        }
        return span;
    }
}

//TODO: convert these to classes?
function createCSArea(tab, name) {
    const areaDiv = document.createElement('div');
    areaDiv.className = name + ' edit-window-area';
    tab.appendChild(areaDiv);
    return areaDiv;
}

function createCSListArea(tab, name, column = true) {
    const areaUL = document.createElement('ul');
    areaUL.className = name + ' edit-window-area' + (column ? ' flexcol' : ' flexrow');
    tab.appendChild(areaUL);
    return areaUL;
}
