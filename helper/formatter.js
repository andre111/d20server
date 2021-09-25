export function prettyTextToHTML(text, wrapLinesInParagraphs = false) {
    if(!text) return '';

    // escape < >
    text = text.replace(/</g, '&lt;');
    text = text.replace(/>/g, '&gt;');
    text = text.replace(/\\n/g, '\n');
    text = text.replace(/\r/g, '');

    // convert char tables to use html formatting
    for(const prettyTable of findPrettyPrintedTables(text)) {
        const htmlTable = convertPrettyPrintedTableToHTML(prettyTable);
        text = text.replace(prettyTable, htmlTable);
    }

    // wrap lines in paragraphs
    if(wrapLinesInParagraphs) {
        const lines = text.split('\n');
        for(var i=0; i<lines.length; i++) {
            var line = lines[i];

            // force linebreak for empty lines
            if(line == '') {
                lines[i] = '<p>&nbsp;</p>';
                continue;
            }

            // count indentation
            var indentation = 0;
            while(line.length > indentation && line[indentation] == ' ') indentation++;

            // add paragraph
            if(indentation == 0) lines[i] = '<p>' + line + '</p>';
            else lines[i] = `<p style="padding-left: ${Math.floor(indentation/4)*40}px;">` + line.substring(indentation) + '</p>';
        }
        text = lines.join('');
    }

    // replace **BOLD** formatting with <strong>BOLD</strong>
    text = text.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    // replace newlines with <br>
    text = text.replace(/\n/g, '<br>');
    return text;
}

function findPrettyPrintedTables(text) {
    const tables = [];

    var currentIndex = 0;
    while(currentIndex < text.length) {
        // search for table start
        if(text.charAt(currentIndex) == '+' && currentIndex < text.length-1 && text.charAt(currentIndex+1) == '-') {
            // in table -> store start and search for end index
            var startIndex = currentIndex;
            var endIndex = -1;
            while(currentIndex < text.length) {
                // check for end of line
                if(currentIndex > 0 && text.charAt(currentIndex-1) == '-' && text.charAt(currentIndex) == '+' && currentIndex < text.length-1 && text.charAt(currentIndex+1) != '-') {
                    // search next line content start
                    currentIndex += 2;
                    while(currentIndex < text.length && /\s/.test(text.charAt(currentIndex))) currentIndex++;

                    // check if table does not continue
                    if(currentIndex == text.length || text.charAt(currentIndex) != '|') {
                        while(currentIndex > 0 && /\s/.test(text.charAt(currentIndex-1))) currentIndex--; // do not eat newlines after a table
                        endIndex = currentIndex;
                        break;
                    }
                }
                currentIndex++;
            }

            if(endIndex != -1) {
                tables.push(text.substring(startIndex, endIndex));
            } else {
                throw new Error('Unterminated table found?');
            }
        }
        currentIndex++;
    }

    return tables;
}

function convertPrettyPrintedTableToHTML(table) {
    // split into lines
    var lines = [];
    var split = table.split('\n');
    for(var i=0; i<split.length; i++) {
        split[i] = split[i].trim();
        if(split[i]) {
            lines.push(split[i]);
        }
    }

    // count columns
    const columns = split[0].split('+').length - 2;
 
    // parse into datastructure
    var rows = [];
    for(var i=0; i<lines.length-1; i++) {
        const line = lines[i];
        if(line.startsWith('+')) {
            // begin new roaw
            rows.push(Array(columns).fill(''));
        } else {
            // append row content to cells
            const cellRow = line.substring(1).split('|');
            for(var c=0; c<columns; c++) {
                rows[rows.length-1][c] += ' '+cellRow[c].trim();
                rows[rows.length-1][c].trim();
            }
        }
    }

    // build html table
    var tableBuilder = '<table>';
    for(const row of rows) {
        tableBuilder += '<tr>';
        for(const cell of row) {
            tableBuilder += '<td>';
            tableBuilder += cell;
            tableBuilder += '</td>';
        }
        tableBuilder += '</tr>';
    }
    tableBuilder += '</table>';
    return tableBuilder;
}
