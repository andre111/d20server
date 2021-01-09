export class IDProvider {
    next() { throw new Error('Cannot call abstract function'); }
}

var _idProvider = null;
export const ID = {
    init: function(idProvider) {
        _idProvider = idProvider;
    },

    next: function() {
        return _idProvider.next();
    }
}
