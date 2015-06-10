function assignMethods(constructor, methods){
    var I;
    for(I in methods)
	if(methods.hasOwnProperty(I))
	    constructor.prototype[I] = methods[I];
}


function assert(obj, type){
    if(typeof obj != type)
	throw TypeError('Type not matching - ' + type + ' Expected');
}


function assertWidget(obj){
    if(!(obj instanceof Widget.Widget))
	throw TypeError('Type not matching - Expect a widget');
}


var Layout = {
    Container: document.registerElement('layout-container', {
	prototype: {
	    __proto__: HTMLElement.prototype
	}
    }),
    HBoxLayout: document.registerElement('layout-HBox', {
	prototype: {
	    __proto__: HTMLElement.prototype
	}
    }),
    VBoxLayout: document.registerElement('layout-VBox', {
	prototype: {
	    __proto__: HTMLElement.prototype
	}
    }),
    Cell: document.registerElement('layout-cell', {
	prototype: {
	    __proto__: HTMLElement.prototype
	}
    })
};


var Base = {
    AbstractTabBar: document.registerElement('widget-abstract-tabbar', {
	prototype: {
	    createdCallback: function(){

	    },
	    __proto__: HTMLElement.prototype
	}
    })
};


var Widget = {
    TabContent: document.registerElement('widget-tab-content', {
	prototype: {
	    createdCallback: function(){
		this.$currentWidget = null;
	    },
	    addWidget: function(widget){
		if(this.children.length)
		    hide(widget);
		else
		    this.$currentWidget = widget;
		this.appendChild(widget);
	    },
	    removeWidget: function(widget, prev, next){
		if(widget == this.$currentWidget){
		    if(!prev)
			prev = widget.previousElementSibling;
		    if(!next)
			next = widget.nextElementSibling;
		    if(next){
			show(next);
			this.$currentWidget = next;
		    }else if(prev){
			show(prev);
			this.$currentWidget = prev;
		    }else{
			this.$currentWidget = null;
		    }
		}
		this.removeChild(widget);
	    },
	    setCurrentWidget: function(widget){
		hide(this.$currentWidget);
		show(widget);
		this.$currentWidget = widget;
	    },
	    getCurrentWidget: function(){
		return this.$currentWidget;
	    },
	    __proto__: HTMLElement.prototype
	}
    }),
    TabBarButton: document.registerElement('widget-tabbar-button', {
	prototype: {
	    createdCallback: function(){
		this.tabbar = null;
		this.dataset.name = '';
	    },
	    __proto__: HTMLElement.prototype
	}
    }),
    TabBarLabel: document.registerElement('widget-tabbar-label', {
	prototype: {
	    createdCallback: function(){

	    },
	    __proto__: HTMLElement.prototype
	}
    }),
    TabBarCloseButton: document.registerElement('widget-tabbar-close-button',{
	prototype: {
	    createdCallback: function(){
		this.tabbar = null;
		this.dataset.name = '';
	    },
	    __proto__: HTMLElement.prototype
	}
    }),
    TabBar: document.registerElement('widget-tabbar', {
	prototype: {
	    createdCallback: function(){
		this.$currentTab = null;
		this.tabs = {};
		this.$dragSrc = null;
	    },
	    addTab: function(name){
		var label = create('widget-tabbar-label', {
		    textContent: name
		});
		var close_button = create('widget-tabbar-close-button', {
		    textContent: '\u00D7',
		    tabbar: this,
		    dataset: {
			name: name
		    }
		});
		var tab = create('widget-tabbar-button', {
		    tabbar: this,
		    draggable: true,
		    dataset: {
			name: name
		    },
		    children: [
			label,
			close_button
		    ]
		});
		if(this.children.length){
		    tab.dataset.current = 'false';
		}else{
		    this.$currentTab = name;
		    tab.dataset.current = 'true';
		}
		// ----
		var tabClicked = function(){
		    this.tabbar.$change(this.dataset.name);
		};
		var dragstart = function(ev){
		    this.tabbar.$dragSrc = this;
		    ev.dataTransfer.effectAllowed = 'move';
		    ev.dataTransfer.setData('text/plain', 'anything');
		};
		var dragover = function(ev){
		    ev.preventDefault();
		};
		var drop = function(ev){
		    var src = this.tabbar.$dragSrc;
		    ev.preventDefault();
		    ev.stopPropagation();
		    if(this != src)
			this.tabbar.swapTab(this, src);
		    this.tabbar.$dragSrc = null;
		}
		// ----
		var closeButtonClicked = function(ev){
		    this.tabbar.$tabclose(this.dataset.name);
		    ev.stopPropagation();
		};
		// ----
		tab.addEventListener('click', tabClicked);
		tab.addEventListener('dragstart', dragstart);
		tab.addEventListener('dragover', dragover);
		tab.addEventListener('drop', drop);
		close_button.addEventListener('click', closeButtonClicked);
		this.tabs[name] = tab;
		this.appendChild(tab);
	    },
	    swapTab: function(tab1, tab2){
		var temp = create('widget-tabbar-button');
		this.insertBefore(temp, tab1);
		this.insertBefore(tab1, tab2);
		this.insertBefore(tab2, temp);
		this.removeChild(temp);
	    },
	    $change: function(name){
		this.tabs[this.$currentTab].dataset.current = 'false';
		this.tabs[name].dataset.current = 'true';
		this.$currentTab = name;
		
		var ev = new CustomEvent('change', {
		    detail: {
			tab_name: name
		    }
		});
		this.dispatchEvent(ev);
	    },
	    $tabclose: function(name){
		var tab = this.tabs[name];
		var prev = tab.previousElementSibling;
		var next = tab.nextElementSibling;
		if(name == this.$currentTab){
		    if(prev){
			this.$currentTab = prev.dataset.name;
			prev.dataset.current = 'true';
		    }else if(next){
			this.$currentTab = next.dataset.name;
			next.dataset.current = 'true';		    
		    }else{
			this.$currentTab = null;
		    }
		}
		this.removeChild(tab);
		delete this.tabs[name];
		
		var ev = new CustomEvent('tabclose', {
		    detail: {
			tab_name: name,
			prev: (prev)? prev.dataset.name: '',
			next: (next)? next.dataset.name: ''
		    }
		});
		this.dispatchEvent(ev);
	    },
	    __proto__: Base.AbstractTabBar.prototype
	}
    })
}


var Binding = {
    TabWidgetBinding: function(){

    }
}
