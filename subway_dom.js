function $(selector){
    return document.querySelector(selector);
}


function $All(selector){
    return document.querySelectorAll(selector);
}


function assignGlobalObject(list){
    var item;
    for(item in list)
	if(list.hasOwnProperty(item))
	    window[item] = $(list[item]);
}


function create(type, properties, ignore_invalid){
    var element = document.createElement(type);
    var I, i, children, style, dataset;
    
    if(properties){
	if(properties["children"]){
	    children = properties["children"];
	    for(i=0; i<children.length; i++){
		if(!children[i] && ignore_invalid)
		    continue;
		element.appendChild(children[i]);
	    }
	}
	if(properties["classList"]){
	    classList = properties["classList"];
	    for(i=0; i<classList.length; i++){
		if(!classList[i] && ignore_invalid)
		    continue;
		element.classList.add(classList[i]);
	    }
	}
	if(properties["style"]){
	    style = properties["style"];
	    for(I in style){
		if(style.hasOwnProperty(I)){
		    if(!style[I] && ignore_invalid)
			continue;
		    element.style[I] = style[I];
		}
	    }
	}
	if(properties["dataset"]){
	    dataset = properties["dataset"];
	    for(I in dataset){
		if(dataset.hasOwnProperty(I)){
		    if(!dataset[I] && ignore_invalid)
			continue;
		    element.dataset[I] = dataset[I];
		}
	    }
	}
	for(I in properties){
	    if(properties.hasOwnProperty(I) && I != "children" && I != "style"){
		if(!properties[I] && ignore_invalid)
		    continue;
		element[I] = properties[I];
	    }
	}
    }
    
    return element;
}


function hide(element){
    element.style.display = 'none';
}


function show(element, display){
    if(!display)
	display = '';
    element.style.display = display;
}


function isHidden(element){
    return (element.style.display == 'none');
}


function toggleHide(element, display){
    if(element.style.display == "none")
	show(element, display);
    else
	hide(element);
}
