import { CanvasWindowEditEntity } from './canvas-window-edit-entity.js';

import { createPropertyEditor } from '../../gui/property-editors.js';
import { MultiLineStringPropertyEditor } from '../../gui/property-editor/special/multi-line-property-editor.js';
import { HTMLStringPropertyEditor } from '../../gui/property-editor/special/html-string-property-editor.js';
import { EntityReferencePropertyEditor } from '../../gui/property-editor/special/entity-reference-property-editor.js';
import { LongListPropertyEditor } from '../../gui/property-editor/special/long-list-property-editor.js';
import { StringSelectionPropertyEditor } from '../../gui/property-editor/special/string-selection-property-editor.js';
import { ImagePropertyEditor } from '../../gui/property-editor/special/image-property-editor.js';
import { PropertyAccessEditor } from '../../gui/property-editor/special/property-access-editor.js';
import { ReferencedImagePropertyEditor } from '../../gui/property-editor/special/referenced-image-property-editor.js';

import { EntityReference } from '../../entity/entity-reference.js';

import { EntityManagers } from '../../../common/entity/entity-managers.js';
import { DefinitionUtils } from '../../../common/util/definitionutil.js'
import { StringFilePropertyEditor } from '../../gui/property-editor/special/string-file-property-editor.js';

export class CanvasWindowEditEntityTab {
    constructor(w, container, links, id, definition) {
        // create tab structure elements
        // create link
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#sptab-'+id;
        a.innerHTML = definition.name;
        li.appendChild(a);
        links.appendChild(li);
        
        // create tab panel
        var panel = document.createElement('div');
        panel.id = 'sptab-'+id;
        panel.style.width = 'auto';
        panel.style.height = 'auto';
        container.appendChild(panel);
        
        this.w = w;
        this.editors = [];
        this.definition = definition;
        this.initContent(panel);
    }
    
    initContent(content) {
        // that was for the old client -> not applicable here
        /*if(this.definition.preferredWidth > 0 && this.definition.preferredHeight > 0) {
            content.style.width = this.definition.preferredWidth+'px';
            content.style.height = this.definition.preferredHeight+'px';
        }*/
        
        //TODO: create content layout
        var styleAttributes = [];
        var styleValues = [];
        switch(this.definition.layout) {
        case 'BORDER':
            content.style.display = 'grid';
            content.style.gridTemplateColumns = 'auto auto auto';
            content.style.gridTemplateRows = 'auto';
            content.style.gridGap = '5px';
            content.style.gridTemplateAreas = "'north north north' 'west center east' 'south south south'";
            styleAttributes = [ 'gridArea', 'gridArea', 'gridArea', 'gridArea', 'gridArea' ];
            styleValues = [ 'north', 'west', 'center', 'east', 'south' ];
            break;
        case 'FREE_SCROLL':
            content.style.backgroundImage = 'url('+this.definition.background+')';
            content.style.width = this.definition.backgroundWidth+'px';
            content.style.height = this.definition.backgroundHeight+'px';
            content.style.position = 'relative';
            break;
        case 'GRID':
            content.style.display = 'grid';
            var columns = '';
            for(var i=0; i<Number(this.definition.layoutParameters[1]); i++) columns = (columns == '' ? 'auto' : columns + ' auto');
            content.style.gridTemplateColumns = columns;
            content.style.gridGap = '5px';
            break;
        case 'X_AXIS':
            //TODO...
            break;
        case 'Y_AXIS':
            break; // nothing to do here
        }
        
        // add content
        var index = 0;
        for(var compDefinition of this.definition.components) {
            var component = null;
            switch(compDefinition.type) {
            case 'EDITOR':
                var property = compDefinition.property;
                var type = this.w.getReference().getPropertyDefinition(property).type;
                var editorType = (compDefinition.editorType != null && compDefinition.editorType != undefined) ? compDefinition.editorType : 'DEFAULT';
                var editor = null;
                
                switch(editorType) {
                case 'DEFAULT':
                    editor = createPropertyEditor(this, type, property, compDefinition.text);
                    component = editor.getContainer();
                    break;
                case 'MULTI_LINE_STRING':
                    if(type != 'STRING') throw 'Cannot use MULTI_LINE_STRING editor for property of type: '+type;
					editor = new MultiLineStringPropertyEditor(this, property, compDefinition.text);
					component = editor.getContainer();
                    break;
                case 'HTML_STRING':
                    if(type != 'STRING') throw 'Cannot use HTML_STRING editor for property of type: '+type;
					editor = new HTMLStringPropertyEditor(this, property, compDefinition.text);
					component = editor.getContainer();
                    break;
                case 'FILE':
                    if(type != 'STRING') throw 'Cannot use FILE editor for property of type: '+type;
                    editor = new StringFilePropertyEditor(this, property, compDefinition.text, compDefinition.filetype);
                    component = editor.getContainer();
                    break;
                case 'REFERENCE_SINGLE':
                    editor = new EntityReferencePropertyEditor(this, property, compDefinition.text, compDefinition.reference);
					component = editor.getContainer();
                    break;
                case 'REFERENCE_MULTI':
                    editor = new LongListPropertyEditor(this, property, compDefinition.text, compDefinition.reference, false);
                    component = editor.getContainer();
                    break;
                case 'EXTENSION_SELECT':
                    if(type != 'STRING') throw 'Cannot use EXTENSION_SELECT editor for property of type: '+type;
                    var extensionPoint = DefinitionUtils.getExtensionPointForProperty(this.w.getReference().getDefinition(), property);
                    if(extensionPoint == null || extensionPoint == undefined) throw 'Property is not used as an extension point: '+property;
                    var extensions = {};
                    for(const [key, value] of Object.entries(extensionPoint.extensionDefinitions)) {
                        extensions[key] = value.displayName;
                    }
                    editor = new StringSelectionPropertyEditor(this, compDefinition.property, compDefinition.text, extensions);
                    component = editor.getContainer();
                    break;
                case 'IMAGE':
                    editor = new ImagePropertyEditor(this, compDefinition.property, 'Image');
                    component = editor.getContainer();
                    break;
                default:
                    throw 'Editor Type not implemented: '+editorType;
                }
                this.editors.push(editor);
                
                // special cases: 
				// free scroll -> make edit component the full size of the container
				if(this.definition.layout == 'FREE_SCROLL') {
					editor.getEditComponent().style.width = compDefinition.w+'px';
					editor.getEditComponent().style.height = compDefinition.h+'px';
				}
				if(compDefinition.disabled) editor.setForceDisable(true);
				if(compDefinition.update) editor.addChangeListener(() => {
					// apply settings
					this.apply(this.w.getReference(), this.w.getAccessLevel());
					this.reload(this.w.getReference(), this.w.getAccessLevel());
				});
                break;
            case 'ACCESS_EDITOR':
                var accessEditor = new PropertyAccessEditor(this, compDefinition.property.split(','), compDefinition.text);
                this.editors.push(accessEditor);
                component = accessEditor.getContainer();
                break;
            case 'OPEN_REFERENCE':
                var prop = compDefinition.property;
                var ref = compDefinition.reference;
                component = document.createElement('button');
                component.innerHTML = 'Open';
                component.style.width = '150px';
                component.style.height = '32px';
                component.onclick = () => {
                    var refID = this.w.getReference().prop(prop).getLong();
                    if(refID > 0) {
                        var entity = EntityManagers.get(ref).find(refID);
                        if(entity != null && entity != undefined) {
                            new CanvasWindowEditEntity(new EntityReference(entity));
                        }
                    }
                };
                break;
            case 'IMAGE_REFERENCE':
                var imageEditor = new ReferencedImagePropertyEditor(this, compDefinition.property, 'Image', compDefinition.text);
                this.editors.push(imageEditor);
                component = imageEditor.getContainer();
                break;
            case 'LABEL':
                component = document.createElement('div');
                component.innerHTML = compDefinition.text;
                break;
            case 'EMPTY':
                component = document.createElement('div');
                break;
            default:
                throw 'Component type not implemented: '+compDefinition.type;
            }
            
            // size / position override
            if(compDefinition.w > 0 && compDefinition.h > 0) {
                component.style.width = compDefinition.w+'px';
                component.style.height = compDefinition.h+'px';
            }
            if(this.definition.layout == 'FREE_SCROLL') {
                component.style.position = 'absolute';
                component.style.left = compDefinition.x+'px';
                component.style.top = compDefinition.y+'px';
            }
            
            // add component
            if(index < styleAttributes.length) {
                component.style[styleAttributes[index]] = styleValues[index];
            }
            content.appendChild(component);
            index++;
        }
    }
    
    reload(reference, accessLevel) {
        for(const editor of this.editors) {
            editor.reload(reference, accessLevel);
        }
    }
    
    apply(reference, accessLevel) {
        for(const editor of this.editors) {
            editor.apply(reference, accessLevel);
        }
    }
    
    onClose() {
        for(const editor of this.editors) {
            editor.onDestroy();
        }
    }
}
