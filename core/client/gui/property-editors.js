import { StringPropertyEditor } from './property-editor/string-property-editor.js';
import { LongPropertyEditor } from './property-editor/long-property-editor.js';
import { BooleanPropertyEditor } from './property-editor/boolean-property-editor.js';
import { DoublePropertyEditor } from './property-editor/double-property-editor.js';
import { StringMapPropertyEditor } from './property-editor/string-map-property-editor.js';
import { LayerPropertyEditor } from './property-editor/layer-property-editor.js';
import { LightPropertyEditor } from './property-editor/light-property-editor.js';
import { EffectPropertyEditor } from './property-editor/effect-property-editor.js';
import { ColorPropertyEditor } from './property-editor/color-property-editor.js';
import { AccessPropertyEditor } from './property-editor/access-property-editor.js';

import { Type } from '../../common/constants.js';

export function createPropertyEditor(tab, type, name, label) {
    switch(type) {
    case Type.STRING:
        return new StringPropertyEditor(tab, name, label);
    case Type.LONG:
        return new LongPropertyEditor(tab, name, label);
    case Type.BOOLEAN:
        return new BooleanPropertyEditor(tab, name, label);
    case Type.DOUBLE:
        return new DoublePropertyEditor(tab, name, label);
    case Type.STRING_MAP:
        return new StringMapPropertyEditor(tab, name, label);
    case Type.LAYER:
        return new LayerPropertyEditor(tab, name, label);
    case Type.LIGHT:
        return new LightPropertyEditor(tab, name, label);
    case Type.EFFECT:
        return new EffectPropertyEditor(tab, name, label);
    case Type.COLOR:
        return new ColorPropertyEditor(tab, name, label);
    case Type.ACCESS:
        return new AccessPropertyEditor(tab, name, label);
    default:
        throw new Error('No PropertyEditor Implementation for type: '+type);
    }
}
