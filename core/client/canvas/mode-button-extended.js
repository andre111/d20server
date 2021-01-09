export class ModeButtonExtended {
    mainButton;
    subButtons;

    container;

    constructor(mainButton, margin, subButtons) {
        this.mainButton = mainButton;
        this.subButtons = subButtons;
        
        // init html elements
        this.container = document.createElement('div');
        this.container.appendChild(this.mainButton.button);
        if(margin > 0) {
            this.mainButton.button.style.marginTop = margin+'px';
        }
        if(this.subButtons != null && this.subButtons != undefined) {
            const p = document.createElement('p');
            p.className = 'mode-sub-panel';
            this.container.appendChild(p);
            
            for(const subButton of this.subButtons) {
                subButton.shrink();
                p.appendChild(subButton.button);
            }
        }
    }
    
    updateState() {
        const active = this.mainButton.updateState();
        if(this.subButtons != null && this.subButtons != undefined) {
            for(const subButton of this.subButtons) {
                subButton.updateState();
                subButton.button.style.display = active ? 'inline-block' : 'none';
            }
        }
    }
}
