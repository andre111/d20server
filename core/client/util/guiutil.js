// @ts-check

// for createInput
var _nextID = 0;

// for makeFancyBG (select and load random bg + source info)
const bgMax = 4;
const bgCurrent = Math.floor(Math.random() * (bgMax + 1));
const bgSource = document.createElement('div');
bgSource.innerHTML = 'Image Source: Loading...';

//TODO: rewrite with fetch
const xhr = new XMLHttpRequest();
xhr.onload = () => {
    if (xhr.status >= 200 && xhr.status < 300) {
        bgSource.innerHTML = 'ImageSource: ' + xhr.responseText;
    } else {
        bgSource.innerHTML = 'ImageSource: failed to load';
    }
};
xhr.open('GET', `/core/files/img/bg/${bgCurrent}.txt`, true);
xhr.send();

//TODO: rewrite this to export single functions
export const GuiUtils = {
    createInput: function (container, type, label) {
        const id = 'i' + (_nextID++);

        const inputElement = document.createElement('input');
        inputElement.id = id;
        inputElement.type = type;
        container.appendChild(inputElement);

        const labelElement = document.createElement('label');
        labelElement.htmlFor = id;
        labelElement.innerHTML = label;
        container.appendChild(labelElement);

        return inputElement;
    },

    createButton: function (container, text, onclick) {
        const button = document.createElement('button');
        button.innerHTML = text;
        button.onclick = onclick;
        container.appendChild(button);
        return button;
    },

    createInternalLink: function (target, text) {
        const link = document.createElement('a');
        link.className = 'internal-link';
        link.href = '#';
        link.dataset['target'] = target;
        link.innerText = text;
        return link;
    },

    //TODO: do not use? fieldsets seem to be annoying to layout, currently only uses left are for quick temporary implementation of basic states
    createBorderedSet: function (label, fixedWidth, fixedHeight) {
        const fieldset = document.createElement('fieldset');
        if (fixedWidth) {
            fieldset.style.width = fixedWidth;
        }
        if (fixedHeight) {
            fieldset.style.height = fixedHeight;
        }

        const legend = document.createElement('legend');
        legend.innerHTML = label;
        fieldset.appendChild(legend);

        return fieldset;
    },

    makeFancyBG: function (div) {
        div.classList.add('fancy-bg');
        div.style.background = `url(/core/files/img/bg/${bgCurrent}.jpg)`;

        // create copyright div
        const copyrightDiv = document.createElement('div');
        copyrightDiv.className = 'copyright';
        copyrightDiv.appendChild(document.createTextNode('Copyright © 2022 André Schweiger'));
        copyrightDiv.appendChild(bgSource);
        div.appendChild(copyrightDiv);
    },

    // makes children elements hoverable (requires 'hoverable' class and a child with 'onhover' class)
    makeHoverable: function (element) {
        // this updates to "tooltip" location
        const updatePosition = (event, hoverable, onhover) => {
            const width = onhover.clientWidth;
            const height = onhover.clientHeight;

            // mouse based position
            //var x = event.clientX - width / 2;
            //var y = event.clientY;
            // fixed position
            const br = hoverable.getBoundingClientRect();
            var x = br.left + (br.right - br.left) / 2 - width / 2;
            var y = br.top - height - 5;

            if (x < 0) x = 0;
            if (y < 0) y = 0;
            if (x + width > window.innerWidth) x = window.innerWidth - width;
            if (y + height > window.innerHeight) y = window.innerHeight - height;

            onhover.style.left = x + 'px';
            onhover.style.top = y + 'px';
        };

        // find all hoverable elements
        for (const e of element.getElementsByClassName('hoverable')) {
            e.onmouseover = (event) => {
                const onhover = e.getElementsByClassName('onhover')[0];
                updatePosition(event, e, onhover); //TODO: this does not always calculate the correct location (on first go, hovering a second time seems to fix that)
                //TODO: remove, this tries to fix this position after 
                //      while this "fixes" the issue mentioned above, it causes short jumping/glitching graphics and looks bad
                //      but currently this is masked by the tooltip fade
                setTimeout(() => updatePosition(event, e, onhover), 1);
            };
        }
    }
}
