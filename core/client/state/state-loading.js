import { State } from './state.js';
import { GuiUtils } from '../util/guiutil.js';

export class StateLoading extends State {
    current;
    lastUpdate;
    amount;

    #progressContainer;
    #progressLabel;
    #progressBar;

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

        this.#progressContainer = document.createElement('div');
        this.#progressContainer.className = 'progress-bar';
        fieldset.appendChild(this.#progressContainer);

        this.#progressBar = document.createElement('div');
        this.#progressContainer.appendChild(this.#progressBar);

        this.#progressLabel = document.createElement('p');
        this.#progressContainer.appendChild(this.#progressLabel);

        this.#progressBar.style.width = '0%';
        this.#progressLabel.innerText = '0%';

        this.current = 0;
        this.lastUpdate = 0;
    }

    exit() {
        const div = document.getElementById('loading');
        div.parentElement.removeChild(div);
    }

    increaseCurrent(by = 1) {
        this.current += by;

        // update is expensive -> only update once a new percentage is reached
        const progress = Math.min(this.current / this.amount * 100, 100);
        if ((this.current - this.lastUpdate) / this.amount >= 0.01 || progress > 0.99) {
            this.lastUpdate = this.current;

            this.#progressBar.style.width = Math.round(progress) + '%';
            this.#progressLabel.innerText = Math.round(progress) + '%';
        }
    }
}
