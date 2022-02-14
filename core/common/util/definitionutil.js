export const DefinitionUtils = {
    getExtensionPointForProperty: function (definition, name) {
        for (var extensionPoint of definition.extensionPoints) {
            if (extensionPoint.mode == 'SELECT_SINGLE' && extensionPoint.property == name) {
                return extensionPoint;
            }
        }
        return null;
    }
}
