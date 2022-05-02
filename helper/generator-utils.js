export function getCombinedString(array, brackets = false) {
    if (array.length == 0) return '';

    var sb = array.join(', ');
    if (brackets) sb = '(' + sb + ')';

    return sb;
}

export function getStringWithNotes(string, notes, brackets = false) {
    var sb = string;

    var notesString = '';
    if (typeof (notes) === 'object') {
        notesString = getCombinedString(notes, brackets);
    } else if (notes) {
        notesString = String(notes);
        if (brackets && notesString) notesString = '(' + notesString + ')';
    }
    if (notesString) {
        sb += ' ';
        sb += notesString;
    }

    return sb;
}

export function getNullableStringWithNotes(obj, postfix = '') {
    if (obj['Wert'] == '0') return '-';
    else return getStringWithNotes(obj['Wert'] + postfix, obj['Anmerkung'], true);
}

export function getSigned(value) {
    if (value > 0) {
        return '+' + value;
    } else {
        return '' + value;
    }
}
