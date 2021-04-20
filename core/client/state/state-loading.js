import { State } from './state.js';
import { GuiUtils } from '../util/guiutil.js';

export class StateLoading extends State {
    current;
    lastUpdate;
    amount;

    progressBar;
    progressLabel;

    constructor(amount) {
        super();
        this.amount = amount;
    }

    init() {
        // create loading div
        const div = document.createElement('div');
        div.id = 'loading';
        div.className = 'full-overlay';
        GuiUtils.makeFancyBG(div);
        document.body.appendChild(div);
        
        // create loading bar
        const fieldset = GuiUtils.createBorderedSet('Loading', '400px', 'auto');
        div.appendChild(fieldset);
        
        this.progressBar = document.createElement('div');
        fieldset.appendChild(this.progressBar);
        
        const labelContainer = document.createElement('div');
        labelContainer.style.display = 'inline-flex';
        labelContainer.style.justifyContent = 'center';
        labelContainer.style.alignItems = 'center';
        labelContainer.style.position = 'absolute';
        labelContainer.style.top = '0';
        labelContainer.style.left = '0';
        labelContainer.style.width = '100%';
        labelContainer.style.height = '100%';
        this.progressBar.appendChild(labelContainer);
        
        this.progressLabel = document.createElement('div');
        labelContainer.appendChild(this.progressLabel);
        
        this.current = 0;
        this.lastUpdate = 0;
        $(this.progressBar).progressbar({
            value: 0,
            change: () => {
                this.progressLabel.innerHTML = Math.round($(this.progressBar).progressbar('value'))+'%';
            }
        });
    }

    exit() {
        const div = document.getElementById('loading');
        div.parentElement.removeChild(div);
    }

    increaseCurrent() {
        this.current++;

        // jQuery progressbar update is expensive -> only update once a new percentage is reached
        //TODO: replace with something cheaper
        if((this.current - this.lastUpdate) / this.amount >= 0.01) {
            this.lastUpdate = this.current;

            $(this.progressBar).progressbar('value', this.current / this.amount * 100);
        }
    }
}
