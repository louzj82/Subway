function printf(args){
    var string = arguments[0];
    var i;
    for(i=1; i<arguments.length; i++){
	string = string.replace('%'+i, arguments[i]);
    }
    return string;
}
