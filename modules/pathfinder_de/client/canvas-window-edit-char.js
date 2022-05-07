// @ts-check
import { LongPropertyEditor } from '../../../core/client/gui/property-editor/long-property-editor.js';

import { HTMLStringPropertyEditor } from '../../../core/client/gui/property-editor/special/html-string-property-editor.js';
import { LongListPropertyEditor } from '../../../core/client/gui/property-editor/special/long-list-property-editor.js';
import { ImagePropertyEditor } from '../../../core/client/gui/property-editor/special/image-property-editor.js';

import { Tabs } from '../../../core/client/gui/tabs.js';

import { MessageService } from '../../../core/client/service/message-service.js';
import { SendChatMessage } from '../../../core/common/messages.js';

import { ATTRIBUTES, SAVES, SKILL_LIST } from './character-values.js';
import { CanvasWindowEditActor } from '../../../core/client/canvas/window/canvas-window-edit-actor.js';
import { ServerData } from '../../../core/client/server-data.js';
import { Access } from '../../../core/common/constants.js';
import { I18N } from '../../../core/common/util/i18n.js';

export class CanvasWindowEditChar extends CanvasWindowEditActor {
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
        header.className = 'edit-window-header';
        container.appendChild(header);
        {
            const imageEditor = new ImagePropertyEditor('imagePath');
            imageEditor.container.className = 'edit-actor-image';
            header.appendChild(imageEditor.container);
            this.registerEditor(imageEditor);

            const headerSide = document.createElement('div');
            headerSide.className = 'edit-window-header-side flexrow';

            headerSide.appendChild(this.createStringEditor('name', '', I18N.get('actor.edit.name.placeholder', 'Name...'), 'edit-actor-name'));
            const classLevelSpan = document.createElement('span');
            classLevelSpan.className = 'cs-class-level flexrow';
            classLevelSpan.appendChild(this.createStringEditor('pf_class', '', I18N.get('pf.char.class.placeholder', 'Class...')));
            classLevelSpan.appendChild(document.createTextNode(I18N.get('pf.char.level', 'Level')));
            classLevelSpan.appendChild(this.createLongEditor('pf_level'));
            classLevelSpan.appendChild(document.createTextNode(I18N.get('pf.char.experience', 'EXP')));
            classLevelSpan.appendChild(this.createLongEditor('pf_experience'));
            headerSide.appendChild(classLevelSpan);

            const headerRow1 = document.createElement('ul');
            headerRow1.className = 'edit-window-header-row flexrow';
            const raceLI = document.createElement('li');
            raceLI.appendChild(this.createStringEditor('pf_race', '', I18N.get('pf.char.race.placeholder', 'Race...')));
            headerRow1.appendChild(raceLI);
            const alignmentLI = document.createElement('li');
            alignmentLI.appendChild(this.createStringEditor('pf_alignment', '', I18N.get('pf.char.alignment.placeholder', 'Alignment...')));
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
                hpLI.appendChild(document.createTextNode(I18N.get('pf.char.hp', 'HP: ')));
                hpLI.appendChild(this.createLongEditor('pf_hp'));
                hpLI.appendChild(document.createTextNode('/'));
                hpLI.appendChild(this.createLongEditor('pf_hpMax'));
                headerRow2.appendChild(hpLI);
                // non lethal damage
                const nldLI = document.createElement('li');
                nldLI.appendChild(document.createTextNode(I18N.get('pf.char.nonlethaldamage', 'Non lethal Damage: ')));
                nldLI.appendChild(this.createLongEditor('pf_nonLethalDamage'));
                headerRow2.appendChild(nldLI);
                // BAB
                const babLI = document.createElement('li');
                babLI.appendChild(document.createTextNode(I18N.get('pf.char.baseattackbonus', 'Base Attack Bonus: ')));
                babLI.appendChild(this.createLongEditor('pf_baseAttackBonus'));
                headerRow2.appendChild(babLI);
                //TODO: move some more stuff up here: initiative, bab?
                headerSide.appendChild(headerRow2);
            }

            header.appendChild(headerSide);
        }

        // Content
        const tabs = document.createElement('div');
        tabs.className = 'edit-window-tabs';
        container.appendChild(tabs);
        //    Attributes
        if (Access.matches(Access.CONTROLLING_PLAYER, accessLevel)) {
            const tab = document.createElement('div');
            tab.dataset.name = I18N.get('pf.char.tabs.attributes', 'Attributes');
            tab.style.display = 'flex';
            tabs.appendChild(tab);

            // Attributes
            const attributesUL = this.createCSListArea(tab, 'cs-attributes', true);
            attributesUL.appendChild(this.createCSAttributeEditor('str'));
            attributesUL.appendChild(this.createCSAttributeEditor('dex'));
            attributesUL.appendChild(this.createCSAttributeEditor('con'));
            attributesUL.appendChild(this.createCSAttributeEditor('int'));
            attributesUL.appendChild(this.createCSAttributeEditor('wis'));
            attributesUL.appendChild(this.createCSAttributeEditor('cha'));


            const otherValuesUL = this.createCSListArea(tab, 'cs-other-values', true);

            // Ini
            const valueIni = this.createValueContainer(I18N.get('pf.char.initiative', 'Initiative'), () => this.sendMacro('Initiative'));
            const iniSpan = document.createElement('span');
            iniSpan.appendChild(this.createLongEditor('pf_initMod'));
            iniSpan.appendChild(document.createTextNode(' = ' + I18N.get('pf.char.dexterity.short', 'DEX') + ' + '));
            iniSpan.appendChild(this.createLongEditor('pf_initMiscMod'));
            valueIni.appendChild(iniSpan);
            otherValuesUL.appendChild(valueIni);

            // AC
            const valueAC = this.createValueContainer(I18N.get('pf.char.ac', 'Armor Class'));
            valueAC.appendChild(this.createCSNamedEditor(I18N.get('pf.char.ac.value', 'Value'), new LongPropertyEditor('pf_ac')));

            const acCalcSpan1 = document.createElement('span');
            acCalcSpan1.className = 'cs-ac-calc';
            acCalcSpan1.style.fontSize = '12px';
            acCalcSpan1.appendChild(document.createTextNode('= 10 - ' + I18N.get('pf.char.size', 'Size') + ' + ' + I18N.get('pf.char.dexterity.short', 'DEX') + ' (Max: '));
            acCalcSpan1.appendChild(this.createLongEditor('pf_acMaxDexMod'));
            acCalcSpan1.appendChild(document.createTextNode(')'));
            valueAC.appendChild(acCalcSpan1);

            const acCalcSpan2 = document.createElement('span');
            acCalcSpan2.className = 'cs-ac-calc';
            acCalcSpan2.style.fontSize = '12px';
            acCalcSpan2.appendChild(document.createTextNode('+'));
            acCalcSpan2.appendChild(this.createLongEditor('pf_acArmorBonus'));
            acCalcSpan2.appendChild(document.createTextNode(I18N.get('pf.char.ac.armor', 'Armor') + ' +'));
            acCalcSpan2.appendChild(this.createLongEditor('pf_acShieldBonus'));
            acCalcSpan2.appendChild(document.createTextNode(I18N.get('pf.char.ac.shield', 'Shield')));
            valueAC.appendChild(acCalcSpan2);

            const acCalcSpan3 = document.createElement('span');
            acCalcSpan3.className = 'cs-ac-calc';
            acCalcSpan3.style.fontSize = '12px';
            acCalcSpan3.appendChild(document.createTextNode('+'));
            acCalcSpan3.appendChild(this.createLongEditor('pf_acNaturalArmor'));
            acCalcSpan3.appendChild(document.createTextNode(I18N.get('pf.char.ac.natural', 'Natural Armor')));
            valueAC.appendChild(acCalcSpan3);

            const acCalcSpan4 = document.createElement('span');
            acCalcSpan4.className = 'cs-ac-calc';
            acCalcSpan4.style.fontSize = '12px';
            acCalcSpan4.appendChild(document.createTextNode('+'));
            acCalcSpan4.appendChild(this.createLongEditor('pf_acDeflectionMod'));
            acCalcSpan4.appendChild(document.createTextNode(I18N.get('pf.char.ac.deflection', 'Deflection')));
            valueAC.appendChild(acCalcSpan4);

            const acCalcSpan5 = document.createElement('span');
            acCalcSpan5.className = 'cs-ac-calc';
            acCalcSpan5.style.fontSize = '12px';
            acCalcSpan5.appendChild(document.createTextNode('+'));
            acCalcSpan5.appendChild(this.createLongEditor('pf_acMiscMod'));
            acCalcSpan5.appendChild(document.createTextNode(I18N.get('pf.char.ac.misc', 'Miscellaneous')));
            valueAC.appendChild(acCalcSpan5);

            valueAC.appendChild(this.createCSNamedEditor(I18N.get('pf.char.ac.touch', 'Touch'), new LongPropertyEditor('pf_acTouch')));
            valueAC.appendChild(this.createCSNamedEditor(I18N.get('pf.char.ac.flatfooted', 'Flat Footed'), new LongPropertyEditor('pf_acFlatFooted')));
            otherValuesUL.appendChild(valueAC);

            // Saves
            const valueSaves = this.createValueContainer(I18N.get('pf.char.saves', 'Saving Throws'));
            for (const save of SAVES) {
                valueSaves.appendChild(this.createCSNamedEditor(I18N.get('pf.char.saves.' + save.name.toLowerCase(), ''), new LongPropertyEditor('pf_save' + save.name), () => this.sendMacro('Rettungswürfe/' + save.display)));

                const saveCalcSpan = document.createElement('span');
                saveCalcSpan.className = 'cs-save-calc';
                saveCalcSpan.appendChild(document.createTextNode(' = '));
                saveCalcSpan.appendChild(this.createLongEditor('pf_save' + save.name + 'Base'));
                saveCalcSpan.appendChild(document.createTextNode(' + ' + I18N.get(ATTRIBUTES[save.attribute].key + '.short', '?')));
                for (const mod of ['Magic', 'Misc', 'Temp']) {
                    saveCalcSpan.appendChild(document.createTextNode(' + '));
                    saveCalcSpan.appendChild(this.createLongEditor('pf_save' + save.name + mod));
                }
                valueSaves.appendChild(saveCalcSpan);
            }
            otherValuesUL.appendChild(valueSaves);

            // CMB
            const valueCMB = this.createValueContainer(I18N.get('pf.char.combatmaneuver', 'Combat Maneuver'), () => this.sendMacro('Kampfmanöver'));
            const cmbSpan = document.createElement('span');
            cmbSpan.style.fontSize = '12px';
            cmbSpan.appendChild(this.createLongEditor('pf_cmb'));
            cmbSpan.appendChild(document.createTextNode(' = ' + I18N.get('pf.char.baseattackbonus.short', 'BAB') + ' + ' + I18N.get('pf.char.strength.short', 'STR') + ' + ' + I18N.get('pf.char.size', 'Size')));
            valueCMB.appendChild(cmbSpan);
            otherValuesUL.appendChild(valueCMB);

            // CMD
            const valueCMD = this.createValueContainer(I18N.get('pf.char.combatmaneuverdefense', 'CM-Defense'), () => this.sendMacro('KM-Verteidigung'));
            const cmdSpan = document.createElement('span');
            cmdSpan.style.fontSize = '12px';
            cmdSpan.appendChild(this.createLongEditor('pf_cmd'));
            cmdSpan.appendChild(document.createTextNode(' = ' + I18N.get('pf.char.baseattackbonus.short', 'BAB') + ' + ' + I18N.get('pf.char.strength.short', 'STR') + ' + ' + I18N.get('pf.char.size', 'Size') + ' + ' + I18N.get('pf.char.dexterity.short', 'DEX') + ' + 10'));
            valueCMD.appendChild(cmdSpan);
            otherValuesUL.appendChild(valueCMD);

            // Armor Check Penalty
            const valueSR = this.createValueContainer(I18N.get('pf.char.armorpenalty', 'Armor Penalty'));
            valueSR.appendChild(this.createLongEditor('pf_armorCheckPenalty'));
            otherValuesUL.appendChild(valueSR);

            // Skills
            const skillsDiv = this.createCSArea(tab, 'cs-skills');
            const skillsTable = document.createElement('table');
            skillsDiv.appendChild(skillsTable);
            const skillsHeader = document.createElement('thead');
            skillsHeader.innerHTML = '<tr><th></th><th>' + I18N.get('pf.char.skill', 'Skill') + '</th><th></th><th></th><th>' + I18N.get('pf.char.skill.ranks', 'Ranks') + '</th><th>' + I18N.get('pf.char.skill.mod', 'Mod') + '</th></tr>';
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
            tab.dataset.name = I18N.get('actor.edit.tabs.bio', 'Biography');
            tab.className = 'edit-window-area edit-window-full-area flexrow';
            tabs.appendChild(tab);

            const valuesLI = document.createElement('li');
            valuesLI.className = 'edit-window-content-sidebar';
            tab.appendChild(valuesLI);
            {
                const valueGender = this.createValueContainer(I18N.get('pf.char.gender', 'Gender'));
                valueGender.appendChild(this.createStringEditor('pf_gender', '', '...'));
                valuesLI.appendChild(valueGender);

                const valueAge = this.createValueContainer(I18N.get('pf.char.age', 'Age'));
                valueAge.appendChild(this.createStringEditor('pf_age', '', '...'));
                valuesLI.appendChild(valueAge);

                const valueSize = this.createValueContainer(I18N.get('pf.char.size', 'Size'));
                valueSize.appendChild(this.createStringEditor('pf_size', '', '...'));
                valuesLI.appendChild(valueSize);

                const valueWeight = this.createValueContainer(I18N.get('pf.char.weight', 'Weight'));
                valueWeight.appendChild(this.createStringEditor('pf_weight', '', '...'));
                valuesLI.appendChild(valueWeight);

                const valueHairColor = this.createValueContainer(I18N.get('pf.char.haircolor', 'Hair Color'));
                valueHairColor.appendChild(this.createStringEditor('pf_hairColor', '', '...'));
                valuesLI.appendChild(valueHairColor);

                const valueEyeColor = this.createValueContainer(I18N.get('pf.char.eyecolor', 'Eye Color'));
                valueEyeColor.appendChild(this.createStringEditor('pf_eyeColor', '', '...'));
                valuesLI.appendChild(valueEyeColor);

                const valueDeity = this.createValueContainer(I18N.get('pf.char.deity', 'Deity / Faith'));
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
            tab.dataset.name = I18N.get('pf.char.tabs.attachments', 'Talents/Spells');
            tab.className = 'edit-window-area edit-window-full-area flexrow';
            tabs.appendChild(tab);

            const valuesLI = document.createElement('li');
            valuesLI.className = 'edit-window-content-sidebar';
            tab.appendChild(valuesLI);
            {
                const valueSR = this.createValueContainer(I18N.get('pf.char.spellresistance', 'Spell Resistance'));
                valueSR.appendChild(this.createLongEditor('pf_spellResistance'));
                valuesLI.appendChild(valueSR);

                //TODO: other spell related values (saves (attribute selection), known spells, ...)
            }

            const editor = new LongListPropertyEditor('attachments', '', 'attachment', false);
            tab.appendChild(editor.container);
            this.registerEditor(editor);
        }
        //    Macros
        if (Access.matches(Access.CONTROLLING_PLAYER, accessLevel)) tabs.appendChild(this.createMacrosTab());
        //    GM
        if (Access.matches(Access.GM, accessLevel)) tabs.appendChild(this.createGMTab());

        Tabs.init(tabs);
        this.setDimensions(700 + 2, 800 + 35);
        this.showPopoutButton(true);
    }

    sendMacro(name) {
        MessageService.send(new SendChatMessage('!!' + name + '§' + this.getReference().getPath()));
    }

    // Complex Editor Structures
    createCSAttributeEditor(propertyAbreviation) {
        const li = document.createElement('li');
        li.className = 'cs-attribute edit-window-value-container';

        const nameP = document.createElement('p');
        nameP.innerText = I18N.get(ATTRIBUTES[propertyAbreviation].key, '?');
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
        nameP.innerText = I18N.get('pf.char.skill.' + skill.name.toLowerCase());
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
        attributeTD.innerText = '= ' + I18N.get(ATTRIBUTES[skill.attribute].key + '.short', '?');
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

    createCSArea(tab, name) {
        const areaDiv = document.createElement('div');
        areaDiv.className = name + ' edit-window-area';
        tab.appendChild(areaDiv);
        return areaDiv;
    }

    createCSListArea(tab, name, column = true) {
        const areaUL = document.createElement('ul');
        areaUL.className = name + ' edit-window-area' + (column ? ' flexcol' : ' flexrow');
        tab.appendChild(areaUL);
        return areaUL;
    }
}
