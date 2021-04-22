import { EditorList } from '../../../core/client/gui/editor-list.js';

import { LongPropertyEditor } from '../../../core/client/gui/property-editor/long-property-editor.js';
import { StringPropertyEditor } from '../../../core/client/gui/property-editor/string-property-editor.js';
import { StringMapPropertyEditor } from '../../../core/client/gui/property-editor/string-map-property-editor.js';
import { AccessPropertyEditor } from '../../../core/client/gui/property-editor/access-property-editor.js';
import { BooleanPropertyEditor } from '../../../core/client/gui/property-editor/boolean-property-editor.js';

import { HTMLStringPropertyEditor } from '../../../core/client/gui/property-editor/special/html-string-property-editor.js';
import { LongListPropertyEditor } from '../../../core/client/gui/property-editor/special/long-list-property-editor.js';
import { ImagePropertyEditor } from '../../../core/client/gui/property-editor/special/image-property-editor.js';
import { StringSelectionPropertyEditor } from '../../../core/client/gui/property-editor/special/string-selection-property-editor.js';

import { Tabs } from '../../../core/client/gui/tabs.js';

import { MessageService } from '../../../core/client/service/message-service.js';
import { SendChatMessage } from '../../../core/common/messages.js';

import { ATTRIBUTES, SAVES, SKILL_LIST } from './character-values.js';
import { DefinitionUtils } from '../../../core/common/util/definitionutil.js';
import { DoublePropertyEditor } from '../../../core/client/gui/property-editor/double-property-editor.js';

export class CanvasWindowEditActor {
    #editorList; 

    constructor(w, reference) {
        // create and register one "tab"/EditorList to manage the editors
        this.#editorList = new EditorList(reference);
        w.tabs = [this.#editorList];
        const container = w.content;
        container.className = 'cs-container';
        
        // build content
        // Header
        const header = document.createElement('div');
        header.className = 'cs-header';
        container.appendChild(header);
        {
            const imageEditor = new ImagePropertyEditor('imagePath');
            imageEditor.getContainer().className = 'cs-image';
            header.appendChild(imageEditor.getContainer());
            this.#editorList.registerEditor(imageEditor);
            
            const headerSide = document.createElement('div');
            headerSide.className = 'cs-header-side flexrow';

            headerSide.appendChild(this.createStringEditor('name', '', 'Name...', 'cs-name'));
            const classLevelSpan = document.createElement('span');
            classLevelSpan.className = 'cs-class-level flexrow';
            classLevelSpan.appendChild(this.createStringEditor('pf_class', '', 'Klasse...'));
            classLevelSpan.appendChild(document.createTextNode('Level'));
            classLevelSpan.appendChild(this.createLongEditor('pf_level'));
            headerSide.appendChild(classLevelSpan);

            const headerRow1 = document.createElement('ul');
            headerRow1.className = 'cs-header-row flexrow';
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
            
            const headerRow2 = document.createElement('ul');
            headerRow2.className = 'cs-header-row flexrow';
            const hpLI = document.createElement('li');
            hpLI.appendChild(document.createTextNode('TP: '));
            hpLI.appendChild(this.createLongEditor('pf_hp'));
            hpLI.appendChild(document.createTextNode('/'));
            hpLI.appendChild(this.createLongEditor('pf_hpMax'));
            headerRow2.appendChild(hpLI);
            const nldLI = document.createElement('li');
            nldLI.appendChild(document.createTextNode('Nicht tödlicher Schaden: '));
            nldLI.appendChild(this.createLongEditor('pf_nonLethalDamage'));
            headerRow2.appendChild(nldLI);
            //TODO: move some more stuff up here: initiative, bab?
            headerSide.appendChild(headerRow2);
            header.appendChild(headerSide);
        }
        
        // Content
        const tabs = document.createElement('div');
        tabs.className = 'cs-tabs';
        container.appendChild(tabs);
        //    Attributes
        {
            const tab = document.createElement('div');
            tab.name = 'Attribute';
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
            const valueIni = createCSValue('Initiative', () => this.sendMacro('Initiative'));
            const iniSpan = document.createElement('span');
            iniSpan.appendChild(this.createLongEditor('pf_initMod'));
            iniSpan.appendChild(document.createTextNode(' = GE + '));
            iniSpan.appendChild(this.createLongEditor('pf_initMiscMod'));
            valueIni.appendChild(iniSpan);
            otherValuesUL.appendChild(valueIni);

            // AC
            const valueAC = createCSValue('Rüstungsklasse');
            valueAC.appendChild(this.createCSNamedEditor('Wert', new LongPropertyEditor('pf_ac')));

            const acCalcSpan = document.createElement('span');
            acCalcSpan.className = 'cs-ac-calc';
            acCalcSpan.style.fontSize = '12px';
            acCalcSpan.appendChild(document.createTextNode('= 10 +'));
            acCalcSpan.appendChild(this.createLongEditor('pf_acArmorBonus'));
            acCalcSpan.appendChild(document.createTextNode('+'));
            acCalcSpan.appendChild(this.createLongEditor('pf_acShieldBonus'));
            acCalcSpan.appendChild(document.createTextNode('+ GE - Größe +'));
            acCalcSpan.appendChild(this.createLongEditor('pf_acNaturalArmor'));
            acCalcSpan.appendChild(document.createTextNode('+'));
            acCalcSpan.appendChild(this.createLongEditor('pf_acDeflectionMod'));
            acCalcSpan.appendChild(document.createTextNode('+'));
            acCalcSpan.appendChild(this.createLongEditor('pf_acMiscMod'));
            valueAC.appendChild(acCalcSpan);

            const maxDexEditor = new LongPropertyEditor('pf_acMaxDexMod');
            maxDexEditor.getEditComponent().style.height = '12px';
            maxDexEditor.getEditComponent().style.width = '30px';
            const maxDexSpan = this.createCSNamedEditor('Max GE: ', maxDexEditor);
            maxDexSpan.style.fontSize = '12px';
            valueAC.appendChild(maxDexSpan);

            valueAC.appendChild(this.createCSNamedEditor('Berührung', new LongPropertyEditor('pf_acTouch')));
            valueAC.appendChild(this.createCSNamedEditor('Auf dem falschen Fuß', new LongPropertyEditor('pf_acFlatFooted')));
            otherValuesUL.appendChild(valueAC);

            // Saves
            const valueSaves = createCSValue('Rettungswürfe');
            for(const save of SAVES) {
                valueSaves.appendChild(this.createCSNamedEditor(save.display, new LongPropertyEditor('pf_save'+save.name), () => this.sendMacro('Rettungswürfe/'+save.display)));

                const saveCalcSpan = document.createElement('span');
                saveCalcSpan.className = 'cs-save-calc';
                saveCalcSpan.appendChild(document.createTextNode(' = '));
                saveCalcSpan.appendChild(this.createLongEditor('pf_save'+save.name+'Base'));
                saveCalcSpan.appendChild(document.createTextNode(' + '+ATTRIBUTES[save.attribute].abr));
                for(const mod of ['Magic', 'Misc', 'Temp']) {
                    saveCalcSpan.appendChild(document.createTextNode(' + '));
                    saveCalcSpan.appendChild(this.createLongEditor('pf_save'+save.name+mod));
                }
                valueSaves.appendChild(saveCalcSpan);
            }
            otherValuesUL.appendChild(valueSaves);

            // BAB
            const valueBAB = createCSValue('Grundangriffsbonus');
            valueBAB.appendChild(this.createLongEditor('pf_baseAttackBonus'));
            otherValuesUL.appendChild(valueBAB);

            // CMB
            const valueCMB = createCSValue('Kampfmanöver', () => this.sendMacro('Kampfmanöver'));
            const cmbSpan = document.createElement('span');
            cmbSpan.style.fontSize = '12px';
            cmbSpan.appendChild(this.createLongEditor('pf_cmb'));
            cmbSpan.appendChild(document.createTextNode(' = GAB + ST + Größe'));
            valueCMB.appendChild(cmbSpan);
            otherValuesUL.appendChild(valueCMB);
            
            // CMD
            const valueCMD = createCSValue('KM-Verteidigung', () => this.sendMacro('KM-Verteidigung'));
            const cmdSpan = document.createElement('span');
            cmdSpan.style.fontSize = '12px';
            cmdSpan.appendChild(this.createLongEditor('pf_cmd'));
            cmdSpan.appendChild(document.createTextNode(' = GAB + ST + Größe + GE + 10'));
            valueCMD.appendChild(cmdSpan);
            otherValuesUL.appendChild(valueCMD);

            // SR
            const valueSR = createCSValue('Zauberresistenz');
            valueSR.appendChild(this.createLongEditor('pf_spellResistance'));
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
            for(var i=0; i<SKILL_LIST.length; i++) {
                skillsBody.appendChild(this.createCSSkillEditor(SKILL_LIST[i], i%2==0));
            }
        }
        //    Biographie
        {
            const tab = document.createElement('div');
            tab.name = 'Biographie';
            tab.className = 'cs-biography cs-area';
            tabs.appendChild(tab);

            const valuesLI = document.createElement('li');
            valuesLI.className = 'cs-content-sidebar';
            tab.appendChild(valuesLI);
            {
                const valueGender = createCSValue('Geschlecht');
                valueGender.appendChild(this.createStringEditor('pf_gender', '', '...'));
                valuesLI.appendChild(valueGender);
                
                const valueAge = createCSValue('Alter');
                valueAge.appendChild(this.createStringEditor('pf_age', '', '...'));
                valuesLI.appendChild(valueAge);
                
                const valueSize = createCSValue('Größe');
                valueSize.appendChild(this.createStringEditor('pf_size', '', '...'));
                valuesLI.appendChild(valueSize);
                
                const valueWeight = createCSValue('Gewicht');
                valueWeight.appendChild(this.createStringEditor('pf_weight', '', '...'));
                valuesLI.appendChild(valueWeight);
                
                const valueHairColor = createCSValue('Haarfarbe');
                valueHairColor.appendChild(this.createStringEditor('pf_hairColor', '', '...'));
                valuesLI.appendChild(valueHairColor);
                
                const valueEyeColor = createCSValue('Augenfarbe');
                valueEyeColor.appendChild(this.createStringEditor('pf_eyeColor', '', '...'));
                valuesLI.appendChild(valueEyeColor);
                
                const valueDeity = createCSValue('Gottheit / Glauben');
                valueDeity.appendChild(this.createStringEditor('pf_deity', '', '...'));
                valuesLI.appendChild(valueDeity);
            }
            
            const editor = new HTMLStringPropertyEditor('bio', '');
            editor.getContainer().style.width = '100%';
            editor.getContainer().style.height = 'calc(100% - 10px)';
            editor.getContainer().style.margin = '5px';
            tab.appendChild(editor.getContainer());
            this.#editorList.registerEditor(editor);
        }
        //    Talente/Zauber
        {
            const tab = document.createElement('div');
            tab.name = 'Talente/Zauber';
            tab.className = 'cs-attachments cs-area';
            tabs.appendChild(tab);
            
            const editor = new LongListPropertyEditor('attachments', '', 'attachment', false);
            tab.appendChild(editor.getContainer());
            this.#editorList.registerEditor(editor);
        }
        //    macros
        {
            const tab = document.createElement('div');
            tab.name = 'Macros';
            tab.className = 'cs-macros cs-area';
            tabs.appendChild(tab);

            const valuesLI = document.createElement('li');
            valuesLI.className = 'cs-content-sidebar cs-macros-sidebar';
            tab.appendChild(valuesLI);
            {
                const valueMods = createCSValue('Modifikatoren');
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
                for(const mod of mods) {
                    valueMods.appendChild(this.createLongEditor(mod[0], mod[1]));
                }
                valuesLI.appendChild(valueMods);
            }
            
            const editor = new StringMapPropertyEditor('macros', '');
            editor.getContainer().style.width = '100%';
            editor.getContainer().style.height = '100%';
            tab.appendChild(editor.getContainer());
            this.#editorList.registerEditor(editor);
        }
        //    GM
        {
            const tab = document.createElement('div');
            tab.name = 'GM';
            tab.className = 'cs-gm cs-area';
            tabs.appendChild(tab);
            
            const valuesLI = document.createElement('li');
            valuesLI.className = 'cs-content-sidebar cs-gm-sidebar';
            tab.appendChild(valuesLI);
            {
                const valueName = createCSValue('Listenpfad');
                valueName.appendChild(this.createStringEditor('path'));
                valuesLI.appendChild(valueName);
                
                const extensionPoint = DefinitionUtils.getExtensionPointForProperty(reference.getDefinition(), 'type');
                var extensions = {};
                for(const [key, value] of Object.entries(extensionPoint.extensionDefinitions)) {
                    extensions[key] = value.displayName;
                }

                const valueType = createCSValue('Typ');
                const typeEditor = new StringSelectionPropertyEditor('type', '', extensions); 
                valueType.appendChild(typeEditor.getContainer());
                this.#editorList.registerEditor(typeEditor);
                valuesLI.appendChild(valueType);

                const valueToken = createCSValue('Token');
                valueToken.className += ' cs-gm-token';
                const tokenSpan = document.createElement('span');
                const imageEditor = new ImagePropertyEditor('tokenImagePath');
                imageEditor.getContainer().className = 'cs-gm-token-image';
                tokenSpan.appendChild(imageEditor.getContainer());
                this.#editorList.registerEditor(imageEditor);
                tokenSpan.appendChild(this.createLongEditor('tokenWidth', 'Breite'));
                tokenSpan.appendChild(this.createLongEditor('tokenHeight', 'Höhe'));
                valueToken.appendChild(tokenSpan);
                valuesLI.appendChild(valueToken);

                const valueSight = createCSValue('Sicht');
                valueSight.appendChild(this.createCSSightEditor('Bright', true, 'Hell'));
                valueSight.appendChild(this.createCSSightEditor('Dim', true, 'Dämmer'));
                valueSight.appendChild(this.createCSSightEditor('Dark', false, 'Dunkel'));
                valuesLI.appendChild(valueSight);
                
                const valueAccess = createCSValue('Zugriff');
                const accessEditor = new AccessPropertyEditor('access', '');
                valueAccess.appendChild(accessEditor.getContainer());
                this.#editorList.registerEditor(accessEditor);
                valuesLI.appendChild(valueAccess);
                
                const valuePlayers = createCSValue('Controlling Players');
                const playerEditor = new LongListPropertyEditor('controllingPlayers', '', 'profile', false);
                valuePlayers.appendChild(playerEditor.getContainer());
                this.#editorList.registerEditor(playerEditor);
                valuesLI.appendChild(valuePlayers);
            }
            
            const editor = new HTMLStringPropertyEditor('gmBio', '');
            editor.getContainer().style.width = 'calc(100% - 200px - 2px - 8px)';
            editor.getContainer().style.height = 'calc(100% - 8px)';
            editor.getContainer().style.margin = '4px';
            tab.appendChild(editor.getContainer());
            this.#editorList.registerEditor(editor);
        }
        
        Tabs.init(tabs);
        w.setDimensions(700+2, 800+35);
    }

    sendMacro(name) {
        MessageService.send(new SendChatMessage('!!'+name));
    }

    // Basic Property Editors
    createLongEditor(property, label, className = '') {
        const editor = new LongPropertyEditor(property, label);
        this.#editorList.registerEditor(editor, true);

        if(className) editor.getContainer().className = className;
        return editor.getContainer();
    }

    createDoubleEditor(property, label, className = '') {
        const editor = new DoublePropertyEditor(property, label);
        this.#editorList.registerEditor(editor, true);

        if(className) editor.getContainer().className = className;
        return editor.getContainer();
    }
    
    createStringEditor(property, label, placeholder = '', className = '') {
        const editor = new StringPropertyEditor(property, label, placeholder);
        this.#editorList.registerEditor(editor);

        if(className) editor.getContainer().className = className;
        return editor.getContainer();
    }

    // Complex Editor Structures
    createCSAttributeEditor(name, propertyAbreviation) {
        const li = document.createElement('li');
        li.className = 'cs-attribute cs-value-container';
        
        const nameP = document.createElement('p');
        nameP.innerText = name;
        nameP.className = 'cs-clickable';
        nameP.onclick = () => this.sendMacro('Attributswürfe/'+name);
        li.appendChild(nameP);
        
        const inputSpan = document.createElement('span');
        li.appendChild(inputSpan);
        {
            //TODO: replace with createLongEditor (needs getting rid off "inline" styling first)
            const valueEditor = new LongPropertyEditor('pf_'+propertyAbreviation, '');
            valueEditor.getEditComponent().style.marginRight = '16px';
            inputSpan.appendChild(valueEditor.getContainer());
            this.#editorList.registerEditor(valueEditor, true);
            
            inputSpan.appendChild(document.createTextNode('±'));
            
            const tempEditor = new LongPropertyEditor('pf_'+propertyAbreviation+'Temp', '');
            tempEditor.getEditComponent().style.color = 'gray';
            inputSpan.appendChild(tempEditor.getContainer());
            this.#editorList.registerEditor(tempEditor, true);
        }
        
        li.appendChild(this.createLongEditor('pf_'+propertyAbreviation+'Mod', '', 'cs-attribute-mod'));
        
        return li;
    }

    createCSSkillEditor(skill, darken) {
        const tr = document.createElement('tr');
        tr.className = 'cs-skill';
        if(darken) tr.style.background = 'rgba(0, 0, 0, 0.05)';
        
        //TODO: replace with createLongEditor (needs getting rid off "inline" styling first)
        const classEditorTD = document.createElement('td');
        const classEditor = new BooleanPropertyEditor('pf_skill'+skill.name+'Class', '');
        classEditor.getEditComponent().style.width = '16px';
        classEditor.getEditComponent().style.height = '16px';
        classEditor.getEditComponent().style.margin = '2px';
        classEditorTD.appendChild(classEditor.getContainer());
        this.#editorList.registerEditor(classEditor, true);
        tr.appendChild(classEditorTD);
        
        const nameTD = document.createElement('td');
        const nameP = document.createElement('span');
        nameP.innerText = skill.display;
        nameP.className = 'cs-clickable';
        nameP.onclick = () => this.sendMacro(skill.macro);
        nameTD.appendChild(nameP);
        if(skill.hasText) {
            //TODO: replace with createLongEditor (needs getting rid off "inline" styling first)
            const textEditor = new StringPropertyEditor('pf_skill'+skill.name+'Text', '', '...............');
            textEditor.getEditComponent().style.width = '70px';
            textEditor.getEditComponent().style.marginLeft = '5px';
            nameTD.appendChild(textEditor.getContainer());
            this.#editorList.registerEditor(textEditor)
        }
        tr.appendChild(nameTD);
        
        const modTD = document.createElement('td');
        modTD.appendChild(this.createLongEditor('pf_skill'+skill.name));
        tr.appendChild(modTD);
        
        const attributeTD = document.createElement('td');
        attributeTD.innerText = '= '+ATTRIBUTES[skill.attribute].abr;
        tr.appendChild(attributeTD);
        
        const ranksTD = document.createElement('td');
        ranksTD.appendChild(document.createTextNode('+'));
        ranksTD.appendChild(this.createLongEditor('pf_skill'+skill.name+'Ranks'));
        tr.appendChild(ranksTD);
        
        const miscTD = document.createElement('td');
        miscTD.appendChild(document.createTextNode('+'));
        miscTD.appendChild(this.createLongEditor('pf_skill'+skill.name+'Misc'));
        tr.appendChild(miscTD);
        
        return tr;
    }

    createCSNamedEditor(name, editor, onclick) {
        const span = document.createElement('span');
    
        const nameP = document.createElement('span');
        nameP.innerText = name;
        if(onclick) {
            nameP.className = 'cs-clickable';
            nameP.onclick = onclick;
        }
        span.appendChild(nameP);
    
        span.appendChild(editor.getContainer());
        this.#editorList.registerEditor(editor, true);
    
        return span;
    }

    createCSSightEditor(lightLevel, hasMultiplier, name) {
        const span = document.createElement('span');
        span.className = 'cs-sight-editor';

        span.appendChild(document.createTextNode(name));
        span.appendChild(this.createDoubleEditor('sight'+lightLevel));
        if(hasMultiplier) {
            span.appendChild(document.createTextNode('x'));
            span.appendChild(this.createDoubleEditor('light'+lightLevel+'Mult'));
        }
        return span;
    }
}

//TODO: convert these to classes?
function createCSArea(tab, name) {
    const areaDiv = document.createElement('div');
    areaDiv.className = name+' cs-area';
    tab.appendChild(areaDiv);
    return areaDiv;
}

function createCSListArea(tab, name, column = true) {
    const areaUL = document.createElement('ul');
    areaUL.className = name+' cs-area'+(column ? ' flexcol' : ' flexrow');
    tab.appendChild(areaUL);
    return areaUL;
}

function createCSValue(name, onclick) {
    const li = document.createElement('li');
    li.className = 'cs-value-container';
    
    const nameP = document.createElement('p');
    nameP.innerText = name;
    if(onclick) {
        nameP.className = 'cs-clickable';
        nameP.onclick = onclick;
    }
    li.appendChild(nameP);
    
    return li;
}
