// @ts-check
import { CanvasWindowEditEntity } from './canvas-window-edit-entity.js';
import { ImagePropertyEditor } from '../../gui/property-editor/special/image-property-editor.js';
import { HTMLStringPropertyEditor } from '../../gui/property-editor/special/html-string-property-editor.js';
import { I18N } from '../../../common/util/i18n.js';
import { Tabs } from '../../gui/tabs.js';
import { Access } from '../../../common/constants.js';
import { LongListPropertyEditor } from '../../gui/property-editor/special/long-list-property-editor.js';
import { ServerData } from '../../server-data.js';
import { StringMapPropertyEditor } from '../../gui/property-editor/string-map-property-editor.js';
import { AccessPropertyEditor } from '../../gui/property-editor/access-property-editor.js';

//TODO: generalize and remove duplication with pathfinder module
export class CanvasWindowEditActor extends CanvasWindowEditEntity {
    constructor(parent, reference) {
        super(parent, reference);
    }

    init() {
        const container = this.content;
        container.className = 'edit-window-container';

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
            header.appendChild(headerSide);
        }

        // Content
        const tabs = document.createElement('div');
        tabs.className = 'edit-window-tabs';
        container.appendChild(tabs);
        //    Biographie
        {
            const tab = document.createElement('div');
            tab.dataset.name = I18N.get('actor.edit.tabs.bio', 'Biography');
            tab.className = 'edit-window-area edit-window-full-area flexrow';
            tabs.appendChild(tab);

            const editor = new HTMLStringPropertyEditor('bio', '');
            editor.container.style.width = 'calc(100% - 200px - 10px)';
            editor.container.style.height = 'calc(100% - 10px)';
            editor.container.style.margin = '5px';
            tab.appendChild(editor.container);
            this.registerEditor(editor);
        }
        //    Attachments
        if (Access.matches(Access.CONTROLLING_PLAYER, accessLevel)) {
            const tab = document.createElement('div');
            tab.dataset.name = I18N.get('actor.edit.tabs.attachments', 'Attachments');
            tab.className = 'edit-window-area edit-window-full-area flexrow';
            tabs.appendChild(tab);

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

    // Tabs
    createMacrosTab() {
        const tab = document.createElement('div');
        tab.dataset.name = I18N.get('actor.edit.tabs.macros', 'Macros');
        tab.className = 'edit-window-area edit-window-full-area flexrow';

        const valuesLI = document.createElement('li');
        valuesLI.className = 'edit-window-content-sidebar edit-window-macros-sidebar';
        tab.appendChild(valuesLI);
        {
            const valueMods = this.createValueContainer(I18N.get('actor.edit.mods', 'Modificators'));
            const mods = [
                ['modAttack', I18N.get('actor.edit.mods.attack', 'Attack')],
                ['modDamage', I18N.get('actor.edit.mods.damage', 'Damage')],
                ['modCritical1', I18N.get('actor.edit.mods.crit', 'Critial %0', '1')],
                ['modCritical2', I18N.get('actor.edit.mods.crit', 'Critial %0', '2')],
                ['modGeneric1', I18N.get('actor.edit.mods.generic', 'Generic %0', '1')],
                ['modGeneric2', I18N.get('actor.edit.mods.generic', 'Generic %0', '2')],
                ['modGeneric3', I18N.get('actor.edit.mods.generic', 'Generic %0', '3')],
                ['modGeneric4', I18N.get('actor.edit.mods.generic', 'Generic %0', '4')],
                ['modGeneric5', I18N.get('actor.edit.mods.generic', 'Generic %0', '5')],
                ['modGeneric6', I18N.get('actor.edit.mods.generic', 'Generic %0', '6')]
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

        return tab;
    }

    createGMTab() {
        const tab = document.createElement('div');
        tab.dataset.name = I18N.get('actor.edit.tabs.gm', 'GM');
        tab.className = 'edit-window-area edit-window-full-area flexrow';

        const valuesLI = document.createElement('li');
        valuesLI.className = 'edit-window-content-sidebar edit-window-gm-sidebar';
        tab.appendChild(valuesLI);
        {
            const valueName = this.createValueContainer(I18N.get('actor.edit.path', 'Path'));
            valueName.appendChild(this.createStringEditor('path'));
            valuesLI.appendChild(valueName);

            const valueType = this.createValueContainer(I18N.get('actor.edit.type', 'Type'));
            valueType.appendChild(this.createExtensionPointEditor('type', ''));
            valuesLI.appendChild(valueType);

            const valueToken = this.createValueContainer(I18N.get('actor.edit.token', 'Token'));
            valueToken.className += ' edit-window-gm-token';
            const tokenSpan = document.createElement('span');
            const imageEditor = new ImagePropertyEditor('tokenImagePath');
            imageEditor.container.className = 'edit-window-gm-token-image';
            tokenSpan.appendChild(imageEditor.container);
            this.registerEditor(imageEditor);
            tokenSpan.appendChild(this.createLongEditor('tokenWidth', I18N.get('actor.edit.token.width', 'Width')));
            tokenSpan.appendChild(this.createLongEditor('tokenHeight', I18N.get('actor.edit.token.height', 'Height')));
            valueToken.appendChild(tokenSpan);
            valuesLI.appendChild(valueToken);

            const valueSight = this.createValueContainer(I18N.get('actor.edit.sight', 'Sight'));
            valueSight.appendChild(this.createCSSightEditor('Bright', true, I18N.get('actor.edit.sight.bright', 'Bright')));
            valueSight.appendChild(this.createCSSightEditor('Dim', true, I18N.get('actor.edit.sight.dim', 'Dim')));
            valueSight.appendChild(this.createCSSightEditor('Dark', false, I18N.get('actor.edit.sight.dark', 'Dark')));
            valuesLI.appendChild(valueSight);

            const valueAccess = this.createValueContainer(I18N.get('actor.edit.access', 'Access'));
            const accessEditor = new AccessPropertyEditor('access', '');
            valueAccess.appendChild(accessEditor.container);
            this.registerEditor(accessEditor);
            valuesLI.appendChild(valueAccess);

            const valuePlayers = this.createValueContainer(I18N.get('actor.edit.controllingplayers', 'Controlling Players'));
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

        return tab;
    }

    // Complex Editor Structures
    createCSSightEditor(lightLevel, hasMultiplier, name) {
        const span = document.createElement('span');
        span.className = 'edit-window-sight-editor';

        span.appendChild(document.createTextNode(name));
        span.appendChild(this.createDoubleEditor('sight' + lightLevel));
        if (hasMultiplier) {
            span.appendChild(document.createTextNode('x'));
            span.appendChild(this.createDoubleEditor('light' + lightLevel + 'Mult'));
        }
        return span;
    }
}
