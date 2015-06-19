var I18N_ITEMS = [
    {
	property_get: 'text',
	property_set: 'textContent'
    },
    {
	property_get: 'title',
	property_set: 'title'
    }
];


function _(msg){
    return msg; /* 先挖個坑 */
}


function translateUI(){
    var i, j, item, elements;
    for(i=0; i<I18N_ITEMS.length; i++){
	item = I18N_ITEMS[i];
	elements = $All(printf('[data-%1]', item.property_get));
	for(j=0; j<elements.length; j++)
	    elements[j][item.property_set] = _(elements[j]['dataset'][item.property_get]);
    }
}
