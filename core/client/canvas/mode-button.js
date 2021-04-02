import { Events } from '../../common/events.js';

export class ModeButton {
    iconName;
    tooltip;
    activeCheck;
    action;

    button;
    icon;

    constructor(iconName, tooltip, activeCheck, action) {
        this.iconName = iconName;
        this.tooltip = tooltip;
        this.activeCheck = activeCheck;
        this.action = action;
        
        // init html elements
        this.button = document.createElement('button');
        this.button.className = 'mode-button';
        this.button.title = tooltip;
        this.button.onclick = () => this.onClick();
        this.icon = document.createElement('img');
        this.button.appendChild(this.icon);
    }
    
    onClick() {
        this.action();
        Events.trigger('updateModeState');
    }
    
    shrink() {
        this.button.className = 'mode-button mode-sub-button'
    }
    
    updateState() {
        if(this.activeCheck(this)) {
            this.icon.src = this.iconName+'Active.png';
            return true;
        } else {
            this.icon.src = this.iconName+'.png';
            return false;
        }
    }
}
