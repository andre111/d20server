// split line at "spaces but only outside Quotes" and "quotes" to sepparate arguments
export function splitArguments(line) {
    var split = [];

    var start = 0;
    var inQuotes = false;
    var shouldSplit = false;
    for(var i=0; i<=line.length; i++) {
        shouldSplit = false;
        if(i == line.length) {
            shouldSplit = true;
        } else if(line[i] == '"') {
            inQuotes = !inQuotes;
            shouldSplit = true;
        } else if(line[i] == ' ' && !inQuotes) {
            shouldSplit = true;
        }

        if(shouldSplit) {
            if(start != i) split.push(line.substring(start, i));
            start = i + 1;
        }
    }
    if(inQuotes) {
        console.log('Unclosed quotes');
        return [];
    }

    return split;
}
