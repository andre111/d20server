// split line at "spaces but only outside Single-Quotes" and "quotes" to sepparate arguments
export function splitArguments(line, limit = 0) {
    if(limit == 1) return [line];

    // iterate every char to keep track of state and split at the correct positions
    var split = [];
    var start = 0;
    var inQuotes = false;
    var shouldSplit = false;
    for(var i=0; i<line.length; i++) {
        shouldSplit = false;
        if(line[i] == '\'') {
            inQuotes = !inQuotes;
            shouldSplit = true;
        } else if(line[i] == ' ' && !inQuotes) {
            shouldSplit = true;
        }

        if(shouldSplit) {
            if(start != i) split.push(line.substring(start, i));
            start = i + 1;
            if(limit > 0 && split.length + 1 == limit) break;
        }
    }

    // add last part (this is the case if the limit was reached)
    // and make sure it does not start with leading whitespace or is encased in quotes
    if(start != line.length) {
        var lastPart = line.substring(start, line.length);
        lastPart = lastPart.trimStart();
        if(lastPart.startsWith('\'') && lastPart.endsWith('\'')) lastPart = lastPart.substring(1, lastPart.length-1);
        split.push(lastPart);
    }

    if(inQuotes) {
        console.log('Unclosed quotes');
        return [];
    }

    return split;
}

export function isString(s) {
    return typeof(s) === 'string' || s instanceof String;
}
