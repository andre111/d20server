// @ts-check

/**
 * Specifies that classes extending this should be serialized to JSON by storying their getter return values.
 * NOTE: this will make it impossible to restore the type.
 * @abstract
 */
export class SerializeWithGetters {
    /**
     * Helper method to allow JSON.stringify to use this class as that does not 'store getters'.
     * @returns {{}} this converted to a plain object
     */
    toJSON() {
        const jsonObj = {};

        // add all properties
        const proto = Object.getPrototypeOf(this);
        for (const key of Object.getOwnPropertyNames(proto)) {
            const desc = Object.getOwnPropertyDescriptor(proto, key);
            const hasGetter = desc && typeof desc.get === 'function';
            if (hasGetter) {
                jsonObj[key] = this[key];
            }
        }

        return jsonObj;
    }
}
