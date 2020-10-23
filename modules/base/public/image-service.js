ImageService = {
    _cache: {},
    _cache_grayscale: {},
    
    //TODO: implement grayscale conversion
    getImage: function(id, grayscale) {
        grayscale = grayscale || false;
        
        // get image from cache
        var cache = grayscale ? ImageService._cache_grayscale : ImageService._cache;
        if(cache[""+id] != null) {
            var img = cache[""+id];
            if(img.complete && img.naturalHeight !== 0) {
                return cache[""+id];
            }
        } else {        
            // load image from server
            var img = new Image();
            img.src = "/image/"+id;
            cache[""+id] = img;
        }
        
        return null;
    }
}
