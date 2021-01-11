import { RenderUtils } from '../util/renderutil.js';

class CachedImage {
    image;

    grayscale;
    converting;

    constructor(image) {
        this.image = image;
        this.grayscale = false;
        this.converting = false;
    }

    async convertToGrayscale() {
        if(this.converting) return;

        this.converting = true;
        RenderUtils.grayscale(this.image);
        this.grayscale = true;
        this.converting = false;
    }
}

var _cache = {};
export const ImageService = {
    MISSING: null,

    init: function() {
        ImageService.MISSING = new Image();
        ImageService.MISSING.src = '/core/files/img/missing.png';
    },
    
    getImage: function(id, grayscale) {
        grayscale = grayscale || false;
        
        return ImageService._getImage('/image/'+id, grayscale);
    },
    
    getInternalImage: function(path, grayscale) {
        return ImageService._getImage(path, grayscale || false);
    },
    
    _getImage: function(path, grayscale) {
        // get image from cache
        const cache = _cache;
        const cachePath = path + ';' + grayscale;
        if(cache[cachePath] != null) {
            var img = cache[cachePath];
            if(img.image.complete && img.image.naturalHeight !== 0) {
                // convert to grayscale if requested and not already done (async)
                if(grayscale && !img.grayscale) {
                    img.convertToGrayscale();
                    return null;
                }

                return img.image;
            }
        } else {
            // load image from server
            var img = new Image();
            img.src = path;
            cache[cachePath] = new CachedImage(img);
        }
        
        return null;
    }
}
