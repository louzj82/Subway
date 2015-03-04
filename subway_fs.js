const FILES_DIR = '.subway/data';
var FS_EXT = require('fs-extra');


/* stackoverflow #9080085 maerics */
function getHomeDir() {
    return process.env[(process.platform == 'win32')? 'USERPROFILE': 'HOME'];
}


function ensureDir(path){
    FS_EXT.ensureDirSync(path);
}


function init_fs(app_name){
    var APP_DIR, DIR = getHomeDir() + '/' + FILES_DIR;
    ensureDir(DIR);
    ensureDir(APP_DIR = DIR + '/' + app_name);
    return APP_DIR;
}
