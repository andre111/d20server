import { CanvasWindow } from '../canvas-window.js';
import { getValueProvider } from '../../gui/value-providers.js';
import { SearchableIDTree } from '../../gui/searchable-id-tree.js';

export class CanvasWindowChoose extends CanvasWindow {
    constructor(type, data, callback) {
        super('Select '+type, true);
       
        //TODO: create html elements
        var tree = new SearchableIDTree(this.frame, null, getValueProvider(type));
        if(data != null) tree.reload(data); //TODO: is reloading required here still?
        
        $(this.frame).dialog('option', 'buttons', [
            {
                text: 'Ok',
                click: function() {
                    var choosen = tree.getSelectedValue();
                    if(choosen != null && choosen != undefined) {
                        callback(choosen);
                    } else {
                        callback(-1);
                    }
                    $(this).dialog('close');
                }
            },
            {
                text: 'Cancel',
                click: function() {
                    $(this).dialog('close');
                }
            }
        ]);
    }
}
