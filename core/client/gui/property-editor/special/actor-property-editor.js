import { PropertyEditor } from '../property-editor.js';
import { CanvasWindowChoose } from '../../../canvas/window/canvas-window-choose.js';
import { ServerData } from '../../../server-data.js';
import { CanvasWindowConfirm } from '../../../canvas/window/canvas-window-confirm.js';
import { MessageService } from '../../../service/message-service.js';
import { CanvasWindowEditEntity } from '../../../canvas/window/canvas-window-edit-entity.js';

import { Type } from '../../../../common/constants.js';
import { MakeActorLocal } from '../../../../common/messages.js';
import { TokenUtil } from '../../../../common/util/tokenutil.js';
import { EntityReference } from '../../../../common/entity/entity-reference.js';
import { I18N } from '../../../../common/util/i18n.js';

export class ActorPropertyEditor extends PropertyEditor {
    #reference;
    #currentActorID;

    constructor(reference) {
        super('actorID', Type.LONG, '');
        
        this.#reference = reference;
        this.#currentActorID = -1;
    }
    
    initContent(label) {
        this.addLabel(I18N.get('token.edit.represents', 'represents '));
        this.button = document.createElement('button');
        this.button.onclick = () => this.doSelectActor();
        this.container.appendChild(this.button);

        this.openButton = document.createElement('button');
        this.openButton.innerText = 'Open';
        this.openButton.onclick = () => this.doOpenActor();
        this.container.appendChild(this.openButton);
        
        if(ServerData.isGM()) {
            this.makeLocalButton = document.createElement('button');
            this.makeLocalButton.innerText = 'Make Local';
            this.makeLocalButton.onclick = () => this.doMakeLocal();
            this.container.appendChild(this.makeLocalButton);
        }

        return this.button;
    }
    
    reloadValue(property) {
        this.#currentActorID = property.getLong();
        this.updateButtons();
    }
    
    applyValue(property) {
        property.setLong(this.#currentActorID);
    }
    
    updateButtons() {
        const actor = TokenUtil.getActor(this.#reference);
        this.button.innerText = actor ? actor.getName() : '<none>';

        if(this.makeLocalButton) {
            this.makeLocalButton.disabled = this.#reference.prop('actorLocal').getBoolean();
        }
    }
    
    doSelectActor() {
        if(this.#reference.prop('actorLocal').getBoolean()) return;

        new CanvasWindowChoose('actor', id => {
            this.#currentActorID = id;
            this.onChange();
        });
    }

    doOpenActor() {
        const actor = TokenUtil.getActor(this.#reference);
        if(actor && actor.canView(ServerData.localProfile)) {
            new CanvasWindowEditEntity(new EntityReference(actor));
        }
    }

    doMakeLocal() {
        if(this.#reference.prop('actorLocal').getBoolean()) return;

        new CanvasWindowConfirm('Make Actor Local', 'Do you want to make the actor local to this token? Changes to the global actor will no longer be reflected in this tokens actor and vice versa. This cannot be undone.', () => {
            MessageService.send(new MakeActorLocal(this.#reference));
        });
    }
}
