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
    Container: document.registerElement('layout-container'),
    HBoxLayout: document.registerElement('layout-HBox'),
    VBoxLayout: document.registerElement('layout-VBox'),
    Cell: document.registerElement('layout-cell')
}


var Widget = {
    Widget: function(element){
	if(element)
	    this.element = element;
	this.data = {};
	this.$display = null;
	if(!Widget.Widget.$init){
	    assignMethods(Widget.Widget, {
		hide: function(){
		    if(this.element.style.display)
			this.$display = this.element.style.display;
		    hide(this.element);
		},
		show: function(display){
		    if(display){
			show(this.element, display);
		    }else{
			if(this.$display)
			    show(this.element, this.$display);
			else
			    show(this.element, '');
		    }
		},
		appendChild: function(element){
		    this.element.appendChild(element);
		},
		removeChild: function(element){
		    this.element.removeChild(element);
		}
	    });
	    Widget.Widget.$init = true;
	}
    },
    TabWidget: function(){
	Widget.Widget.call(this);
	this.$currentIndex = null;
	this.$widgets = [];
	this.$dragSrc = null;
	this.on_change = null;
	this.on_tab_close_request = null;
	
	this.tabBar = create('div', {
	    className: 'ui_tab_bar'
	});
	this.content = create('div', {
	    className: 'ui_tab_content'
	});
	this.element = create('div', {
	    className: 'ui_tab_element',
	    children :[
		this.tabBar,
		this.content
	    ]
	});

	if(!Widget.TabWidget.$init){
	    assignMethods(Widget.TabWidget, {
		addTab: function(widget, label){
		    assertWidget(widget);
		    if(!widget.element)
			this.$err_expect_element.call();
		    this.$widgets.push(widget);

		    /* note: bind 2 objects (tabwidget and widget) on button */
		    var button = create('span', {
			tabWidget: this,
			widget: widget,
			draggable: true,
			className: 'ui_tab_button'
		    });
		    var label = create('span', {
			textContent: label,
			className: 'ui_tab_label'
		    });
		    var close_button = create('span', {
			textContent: '\u00D7',
			tabWidget: this,
			widget: widget,
			className: 'ui_tab_close_button'
		    });
		    button.appendChild(label);
		    button.appendChild(close_button);
		    button.dataset.current = (this.$currentIndex == null);
		    widget.data.button = button;
		    widget.data.close_button = close_button;
		    
		    if(this.$currentIndex == null)
			this.$currentIndex = 0;
		    else
			widget.hide();

		    this.tabBar.appendChild(button);
		    addListeners(button, {
			click: function(){
			    if(this.widget.data.del)
				return;
			    this.tabWidget.setCurrentWidget(this.widget);
			},
			dragstart: function(ev){
			    this.tabWidget.$dragSrc = this.widget;
			    ev.dataTransfer.effectAllowed = 'move';
			    ev.dataTransfer.setData('text/plain', 'anything');
			},
			dragover: function(ev){
			    ev.preventDefault();
			},
			drop: function(ev){
			    var src = this.tabWidget.$dragSrc;
			    ev.preventDefault();
			    if(ev.stopPropagation)
				ev.stopPropagation();
			    if(this.widget != src)
				this.tabWidget.swapTab(this.widget, src);
			    this.tabWidget.$dragSrc = null;
			}
		    });
		    addListeners(close_button, {
			click: function(){
			    if(this.tabWidget.on_tab_close_request){
				if(this.tabWidget.on_tab_close_request(this.widget) != false){
				    this.widget.data.del = true;
				    this.tabWidget.removeTab(this.widget);
				}
			    }else{
				this.widget.data.del = true;
				this.tabWidget.removeTab(this.widget);
			    }
			}
		    });
		    this.content.appendChild(widget.element);
		},
		removeTab: function(widget){
		    assertWidget(widget);
		    var index, widgets = this.$widgets;
		    index = widgets.indexOf(widget);
		    if(index == -1)
			this.$err_expect_in_tabs.call();
		    if(this.$currentIndex > index)
			this.$currentIndex--;
		    else if(this.$currentIndex == index && index)
			this.setCurrentIndex(index-1);
		    this.tabBar.removeChild(widget.data.button);
		    var removed_widget = widgets.splice(index, 1)[0];
		    removed_widget.element.parentNode.removeChild(removed_widget.element);
		    if(this.$currentIndex == index && !index){
			if(widgets.length){
			    widgets[0].show();
			    widgets[0].data.button.dataset.current = true;
			    if(this.on_change)
				this.on_change(widgets[0]);
			}else{
			    this.$currentIndex = null;
			}
		    }
		    return removed_widget;
		},
		swapTab: function(widget1, widget2){
		    var widgets = this.$widgets;
		    var i1 = widgets.indexOf(widget1);
		    var i2 = widgets.indexOf(widget2);
		    if(i1 == -1 || i2 == -1)
			this.$err_expect_in_tabs.call();
		    widgets[i1] = widget2;
		    widgets[i2] = widget1;
		    if(i1 == this.$currentIndex)
			this.$currentIndex = i2;
		    else if(i2 == this.$currentIndex)
			this.$currentIndex = i1;
		    var temp = create('div');
		    var e1 = widget1.data.button;
		    var e2 = widget2.data.button;
		    e1.parentNode.insertBefore(temp, e1);
		    e2.parentNode.insertBefore(e1, e2);
		    temp.parentNode.insertBefore(e2, temp);
		    temp.parentNode.removeChild(temp);
		},
		replaceWidget: function(old, widget){
		    assertWidget(old);
		    assertWidget(widget);
		    var index, widgets = this.$widgets;
		    index = widgets.indexOf(old);
		    if(index == -1)
			this.$err_expect_in_tabs.call();
		    if(index != this.$currentIndex)
			widget.hide();
		    old.data.button.widget = widget;
		    old.data.close_button.widget = widget;
		    widget.data.button = old.data.button;
		    widget.data.close_button = old.data.close_button;
		    this.content.removeChild(old.element);
		    this.content.appendChild(widget.element);
		    widgets[index] = widget;
		},
		getCurrentWidget: function(){
		    var current = this.$widgets[this.$currentIndex];
		    if(!current)
		    	this.$err_expect_in_tabs.call();
		    return current;
		},
		setCurrentWidget: function(widget){
		    assertWidget(widget);
		    var current = this.getCurrentWidget();
		    if(widget == current)
			return;
		    var index, widgets = this.$widgets;
		    index = widgets.indexOf(widget)
		    if(index == -1)
			this.$err_expect_in_tabs.call();
		    current.hide();
		    current.data.button.dataset.current = false;
		    widget.show();
		    widget.data.button.dataset.current = true;
		    this.$currentIndex = index;
		    if(this.on_change)
			this.on_change(widget);
		},
		setCurrentIndex: function(index){
		    assert(index, 'number');
		    if(index == this.$currentIndex)
			return;
		    var current = this.getCurrentWidget()
		    current.hide();
		    current.data.button.dataset.current = false;
		    this.$widgets[index].show();
		    this.$widgets[index].data.button.dataset.current = true;
		    this.$currentIndex = index;
		    if(this.on_change)
			this.on_change(this.$widgets[index]);
		},
		isWidgetInTabs: function(widget){
		    assertWidget(widget);
		    return (this.$widgets.indexOf(widget) != -1);
		},
		isWidgetCurrent: function(widget){
		    assertWidget(widget);
		    return (this.getCurrentWidget() == widget);
		},
		'$err_expect_element': function(){
		    throw Error('Expect a widget with its element');
		},
		'$err_expect_in_tabs': function(){
		    throw Error('Expect a widget in the TabWidget');
		}
	    });
	    Widget.TabWidget.$init = true;
	}
    }
}


/* Inherit */
Widget.TabWidget.prototype = Object.create(Widget.Widget.prototype);
Widget.TabWidget.prototype.constructor = Widget.TabWidget;
