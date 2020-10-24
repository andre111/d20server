TokenRenderer = {
    
    renderTokens: function(ctx, tokenStream, viewer, highlightToken, grayscale) {
        var tokens = tokenStream.value();
        
        // render token
        for(var token of tokens) {
            var loc = TokenRenderer.getTokenLocation(token, true);
            TokenRenderer.renderToken(ctx, token, viewer, loc.x, loc.y, grayscale);
        }
        
        //TODO: render additional info
    },
    
    renderToken: function(ctx, token, viewer, x, y, grayscale) {
        var img = ImageService.getImage(token.properties["imageID"].value, grayscale);
        if(img == null) img = ImageService.MISSING;
        
        if(img != null) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Number(token.properties["rotation"].value) * Math.PI / 180);
            
            ctx.drawImage(img, -Number(token.properties["width"].value)/2, -Number(token.properties["height"].value)/2, Number(token.properties["width"].value), Number(token.properties["height"].value));
            
            ctx.restore();
        }
    },
    
    _lastTokenLocations: new Map(), //TODO: clear on map change -> observer system required
    getTokenLocation: function(token, update) {
        var lastLocation = TokenRenderer._lastTokenLocations.get(token.id);
        if(lastLocation == null || lastLocation == undefined) {
            lastLocation = { x: Number(token.properties["x"].value), y: Number(token.properties["y"].value) };
        }
        
        var x = lastLocation.x;
        var y = lastLocation.y;
        if(update) {
            x += (Number(token.properties["x"].value) - lastLocation.x) * 0.25;
            y += (Number(token.properties["y"].value) - lastLocation.y) * 0.25;
        }
        var currentLocation = { x: x, y: y };
        
        TokenRenderer._lastTokenLocations.set(token.id, currentLocation);
        return currentLocation;
    }
}
