import { Menu } from '../../../gui/menu.js';

export class FileMenu extends Menu {
    file;

    constructor(file, x, y) {
        super(x, y);

        this.file = file;

        for(const action of file.getWindow().getFileActions()) {
            if(action.shouldShowFor(file)) {
                this.createItem(this.container, action.getName(), () => {
                    action.applyTo(file);
                    this.close();
                });
            }
        }
        this.open();
    }
}
