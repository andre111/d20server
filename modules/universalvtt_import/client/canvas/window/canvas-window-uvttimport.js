import { CanvasWindow } from '../../../../../core/client/canvas/canvas-window.js';
import { MessageService } from '../../../../../core/client/service/message-service.js';
import { SendChatMessage } from '../../../../../core/common/messages.js';

export class CanvasWindowUVTTImport extends CanvasWindow {
    #file;
    #nameInput;
    #importLightsInput;

    constructor(file, name) {
        super('Universal VTT Import', false);

        this.#file = file;
        this.initContent(name);
    }

    initContent(name) {
        // create container
        const container = this.frame;
        
        // create panel
        const panel = document.createElement('div');
        panel.style.width = 'auto';
        panel.style.height = 'auto';
        panel.style.display = 'grid';
        panel.style.gridTemplateColumns = 'auto auto';
        panel.style.gridGap = '5px';
        container.appendChild(panel);

        // create entries
        const nameP = document.createElement('p');
        nameP.innerText = 'Map Name: ';
        panel.appendChild(nameP);
        panel.appendChild(this.#nameInput = document.createElement('input'));
        this.#nameInput.className = 'settings-text';
        this.#nameInput.value = name ?? 'Imported Map';

        const importLightsP = document.createElement('p');
        importLightsP.innerText = 'Import Lights: ';
        panel.appendChild(importLightsP);
        panel.appendChild(this.#importLightsInput = document.createElement('input'));
        this.#importLightsInput.type = 'checkbox';
        this.#importLightsInput.className = 'settings-toggle';

        // buttons
        $(this.frame).dialog('option', 'buttons', [
            {
                text: 'Import',
                click: () => {
                   this.doImport();
                    $(this.frame).dialog('close');
                }
            },
            {
                text: 'Cancel',
                click: () => {
                    $(this.frame).dialog('close');
                }
            }
        ]);
    }

    doImport() {
        const msg = new SendChatMessage(`/uvttimport "${this.#file}" "${this.#nameInput.value}" ${this.#importLightsInput.checked}`);
        MessageService.send(msg);
    }
}
