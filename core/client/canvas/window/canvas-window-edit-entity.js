import { CanvasWindow } from '../canvas-window.js';
import { CanvasWindowEditEntityTab } from './canvas-window-edit-entity-tab.js';
import { ServerData } from '../../server-data.js';
import { Access } from '../../../common/constants.js';

export class CanvasWindowEditEntity extends CanvasWindow {
    constructor(reference) {
        super('Edit '+reference.getDefinition().displayName, true);
        
        this.reference = reference;
        this.tabs = [];
        
        //TODO: add entity listener to reload values when changed/close when delete
        
        var w = this;
        $(this.frame).dialog('option', 'buttons', [
            {
                text: 'Ok',
                click: function() {
                    w.doUpdateEntity();
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
        //$(this.frame).dialog('option', 'resizable', false);
        $(this.frame).dialog('option', 'width', 1000+5);
        $(this.frame).dialog('option', 'height', 700+5);
        
        this.initTabs();
        this.reloadValues();
    }
    
    initTabs() {
        // create container
        var container = this.frame;
        var links = document.createElement('ul');
        container.appendChild(links);
        container.style.padding = '0em 0em';
        
        // create tabs
        this.tabs = [];
        var id = 0;
        const accessLevel = this.getAccessLevel();
        for(const tabDefinition of this.reference.getDefinition().editorTabs) {
            if(Access.matches(tabDefinition.access, accessLevel)) {
                this.tabs.push(new CanvasWindowEditEntityTab(this, container, links, id++, tabDefinition));
            }
        }
        for(const extDef of this.reference.getActiveExtensions()) {
            for(const tabDefinition of extDef.editorTabs) {
                if(Access.matches(tabDefinition.access, accessLevel)) {
                    this.tabs.push(new CanvasWindowEditEntityTab(this, container, links, id++, tabDefinition));
                }
            }
        }
        
        // convert to jquery-ui tabs
        $(container).tabs({
            heightStyle: 'content'
        });
    }
    
    getReference() {
        return this.reference;
    }
    
    getAccessLevel() {
        return this.reference.getAccessLevel(ServerData.localProfile);
    }
    
    reloadValues() {
        var accessLevel = this.getAccessLevel();
        for(const tab of this.tabs) {
            tab.reload(this.reference, accessLevel);
        }
    }
    
    doUpdateEntity() {
        // apply settings
        var accessLevel = this.getAccessLevel();
        for(const tab of this.tabs) {
            tab.apply(this.reference, accessLevel);
        }
        
        // update entity
        this.reference.performUpdate();
    }
    
    onClose() {
        super.onClose();
        for(const tab of this.tabs) {
            tab.onClose();
        }
    }
}
