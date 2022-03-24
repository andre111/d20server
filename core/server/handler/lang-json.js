// @ts-check
import { I18N } from '../../common/util/i18n.js';

var text = '';
export function buildLangJson() {
    text = I18N.getAsJson();
}

export function getLangJson(req, res, next) {
    if (req.path == '/lang.json') {
        res.send(text);
    } else {
        next();
    }
}
