var _cache = {};
var _missing = null;
export const ImageService = {
    init: function() {
        _missing = new Image();
        _missing.src = '/public/img/missing.png';
    },
    
    getImage: function(id, grayscale) {
        grayscale = grayscale || false;
        
        return ImageService._getImage('/image/'+id+(grayscale ? '?grayscale=1' : ''));
    },
    
    getInternalImage: function(path) {
        return ImageService._getImage(path);
    },
    
    _getImage: function(path) {
        // get image from cache
        const cache = _cache;
        if(cache[path] != null) {
            var img = cache[path];
            if(img.complete && img.naturalHeight !== 0) {
                return img;
            }
        } else {
            // load image from server
            var img = new Image();
            img.src = path;
            cache[path] = img;
        }
        
        return null;
    }
}
