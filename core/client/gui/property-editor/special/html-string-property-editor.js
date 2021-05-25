import { PropertyEditor } from '../property-editor.js';
import { createDefaultFileManager } from '../../../canvas/window/canvas-window-filemanager.js';

import { Type } from '../../../../common/constants.js';
import { FILE_TYPE_IMAGE } from '../../../../common/util/datautil.js';
import { I18N } from '../../../../common/util/i18n.js';

export class HTMLStringPropertyEditor extends PropertyEditor {
    constructor(name, label) {
        super(name, Type.STRING, label);
    }
    
    initContent(label) {
        this.container.classList.add('html-editor');
        this.form = document.createElement('form');
        this.form.onsubmit = () => this.doSubmit();
        this.textDiv = document.createElement('div');
        this.textDiv.style.width = '100%';
        this.textDiv.style.height = '100%';
        this.textDiv.style.overflow = 'auto';
        this.textDiv.style.resize = 'none';
        this.textDiv.style.fontFamily = 'monospace';
        this.textDiv.style.fontVariant = 'initial';
        this.form.appendChild(this.textDiv);
        this.container.appendChild(this.form);

        this.editButton = document.createElement('button');
        this.editButton.innerText = I18N.get('global.edit', 'Edit');
        this.editButton.onclick = () => this.createEditor();
        this.container.appendChild(this.editButton);
        
        return this.editButton;
    }

    createEditor() {
        if(this.editor) return;
        this.editButton.style.display = 'none';

        tinymce.init({
            target: this.textDiv,
            plugins: 'table,lists,hr,image',
            toolbar: 'undo redo | bold italic | alignleft aligncenter alignright | bullist numlist table hr image',
            menubar: false,
            statusbar: false,
            inline: true,
            table_style_by_css: true,
            table_default_styles: {
                'border': 'solid 1px gray',
                'border-collapse': 'collapse', 
                'padding': '5px',
                'margin-left': 'auto',
                'margin-right': 'auto'
            },
            file_picker_types: 'image',
            file_picker_callback: (callback, value, meta) => this.doOpenFilePicker(callback, value, meta)
        }).then(result => {
            this.editor = result[0];
            this.editor.focus();
            this.editor.on('blur', () => this.doSubmit());
        });
    }
    
    reloadValue(reference, name) {
        const newValue = reference.getString(name);
        if(newValue != this.value) {
            this.value = newValue;
            this.setHTMLValue();
        }
    }
    
    applyValue(reference, name) {
        reference.setString(name, this.value);
    }
    
    setHTMLValue() {
        this.textDiv.innerHTML = DOMPurify.sanitize(this.value, {USE_PROFILES: {html: true}}); 
    }
    
    doSubmit() {
        this.value = this.editor.getContent();

        this.editor.destroy();
        this.editor = null;
        this.editButton.style.display = '';

        this.onChange();
    }

    doOpenFilePicker(callback, value, meta) {
        const manager = createDefaultFileManager(value.replace('data/files', ''), this.window);
        manager.init(file => {
            if(!file) return;
            if(meta.filetype == 'image' && file.getType() == FILE_TYPE_IMAGE) {
                callback('/data/files' + file.getPath(), { alt: file.getName() });
                manager.close();
            }
        });
        // force the manager over top of tinyMCE dialogs (TODO: is there a cleaner way?)
        manager.zIndex = 1400;
    }
    
    onDestroy() {
        if(this.editor) {
            tinymce.remove(this.editor);
        }
    }
}
