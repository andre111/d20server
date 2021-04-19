import { ServerData } from '../server-data.js';

export class EditorList {
    #editors = [];
    #reference;

    constructor(reference) {
        this.#reference = reference;
    }

    registerEditor(editor, autoUpdate = false) {
        this.#editors.push(editor);

        // automatically apply changes (to local reference), so reloading when the entity is changed does not revert locally modified values
        if(!this.#reference) return; //TODO: remove this is just so the stubbedf dev window works
        editor.addChangeListener(() => {
            const accesLevel = this.#reference.getAccessLevel(ServerData.localProfile);
            
            editor.apply(this.#reference, accesLevel);
            if(autoUpdate) this.reload(this.#reference, accesLevel);
        });
    }

    reload(reference, accessLevel) {
        for(const editor of this.#editors) {
            editor.reload(reference, accessLevel);
        }
    }
    
    apply(reference, accessLevel) {
        for(const editor of this.#editors) {
            editor.apply(reference, accessLevel);
        }
    }
    
    onClose() {
        for(const editor of this.#editors) {
            editor.onDestroy();
        }
    }
}
