export class Tabs {
    static init(container) {
        // create a cached list of all container contents
        const content = [];
        for(const c of container.childNodes) {
            content.push(c);
        }
        
        // create new tab wrapper divs with the old content
        const tabs = [];
        for(const c of content) {
            const tab = document.createElement('div');
            tab.className = 'tab-content';
            tab.name = c.name;
            tab.title = c.title;
            tab.appendChild(c);
            tabs.push(tab);
            
            c.title = '';
        }
        container.classList.add('tabs');
        
        // create a div to contain the "buttons"
        const buttonDiv = document.createElement('div');
        buttonDiv.className = 'tab-buttons';
        container.prepend(buttonDiv);
        
        // append buttons and tab wrappers
        for(var i=0; i<tabs.length; i++) {
            const index = i;
            
            const button = document.createElement('button');
            button.innerText = tabs[i].name;
            button.title = tabs[i].title;
            button.onclick = () => Tabs.select(container, index);
            buttonDiv.appendChild(button);

            tabs[i].title = '';
            
            container.appendChild(tabs[i]);
        }
        
        if(tabs.length > 0) Tabs.select(container, 0);
    }

    static select(container, index) {
        const tabs = container.getElementsByClassName('tab-content');
        const buttons = container.getElementsByClassName('tab-buttons')[0].childNodes;
        
        // hide all tabs / reset all buttons
        for(const tab of tabs) tab.classList.add('tab-hidden'); //tab.style.display = 'none';
        for(const button of buttons) button.classList.remove('active');
        
        // show selected tab
        tabs[index].classList.remove('tab-hidden'); //tabs[index].style.display = 'block';
        buttons[index].classList.add('active');
    }
}
