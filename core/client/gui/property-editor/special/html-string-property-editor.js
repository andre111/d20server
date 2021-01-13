import { PropertyEditor } from '../property-editor.js';
import { GuiUtils } from '../../../util/guiutil.js';
import { createDefaultFileManager } from '../../../canvas/window/canvas-window-filemanager.js';

import { Type } from '../../../../common/constants.js';

export class HTMLStringPropertyEditor extends PropertyEditor {
    constructor(tab, name, label) {
        super(name, Type.STRING, label);
    }
    
    initContent(label) {
        GuiUtils.makeBordered(this.container, label);
        
        this.form = document.createElement('form');
        this.form.style.width = '100%';
        this.form.style.height = '100%';
        this.form.onsubmit = () => this.doSubmit(tinymce.activeEditor);
        this.textDiv = document.createElement('div');
        this.textDiv.style.width = '100%';
        this.textDiv.style.height = '100%';
        this.textDiv.style.overflow = 'auto';
        this.textDiv.style.resize = 'none';
        this.textDiv.style.fontFamily = 'monospace';
        this.form.appendChild(this.textDiv);
        this.container.appendChild(this.form);
        
        // editor creation needs to be delayed so the dom is fully initialized
        setTimeout(() => {
            if(!this.input.disabled) {
                tinymce.init({
                    target: this.textDiv,
                    plugins: 'table,lists,hr,image,save',
                    toolbar: 'undo redo styleselect bold italic | alignleft aligncenter alignright | bullist numlist table hr image | save',
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
                    file_picker_callback: (callback, value, meta) => this.doOpenFilePicker(callback, value, meta),
                    onchange_callback: inst => this.doSubmit(inst)
                }).then(result => this.editor = result[0]);
            }
        }, 1);
        
        this.input = document.createElement('input');
        return this.input;
    }
    
    reloadValue(property) {
        this.value = property.getString();
        this.setHTMLValue();
    }
    
    applyValue(property) {
        property.setString(this.value);
    }
    
    setHTMLValue() {
        this.textDiv.innerHTML = this.value;
    }
    
    doSubmit(editor) {
        this.value = editor.getContent();
    }

    doOpenFilePicker(callback, value, meta) {
        const manager = createDefaultFileManager();
        //TODO: select existing file if possible (based on value)
        manager.init(file => {
            if(!file) return;
            if(meta.filetype == 'image' && file.getType() == 'image') {
                callback('/data/files' + file.getPath(), { alt: file.getName() });
                manager.close();
            }
        });
        // force the manager over top of tinyMCE dialogs (TODO: is there a cleaner way?)
        manager.frame.parentElement.style.zIndex = 1400;
    }
    
    onDestroy() {
        if(this.editor) {
            tinymce.remove(this.editor);
        }
    }
}
