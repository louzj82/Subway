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
}


var Widget = {
    TabBar: document.registerElement('widget-tab-bar', {
	prototype: {
	    __proto__: HTMLElement.prototype
	}
    }),
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
    TabWidget: document.registerElement('widget-tabwidget', {
	prototype: {
	    createdCallback: function(){
		this.$currentIndex = null;
		this.$widgets = [];
		this.$dragSrc = null;
		
		this.tabBar = create('widget-tab-bar');
		this.content = create('widget-tab-content');
		this.appendChild(this.tabBar);
		this.appendChild(this.content);
	    },
	    __proto__: HTMLElement.prototype
	}
    })
}

