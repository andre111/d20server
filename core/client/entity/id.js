
import { IDProvider } from '../../common/entity/id.js';

export class ClientIDProvider extends IDProvider {
    next() {
        return 0;
    }
}
