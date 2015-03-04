const APP_NAME = 'org.subway.chat.irc';
const LOG_EXCLUDE = ['NickServ', 'ChanServ'];
var APP_DIR, LOG_DIR, log_fd = {};


function init_log(){
    APP_DIR = init_fs(APP_NAME);
    FS_EXT.ensureDirSync(LOG_DIR = APP_DIR + '/log');
}


function openLog(server, channel){
    if(LOG_EXCLUDE.indexOf(channel) != -1)
	return;
    var channel_dir, fd, log_file;
    FS_EXT.ensureDirSync(channel_dir = printf('%1/%2/%3', LOG_DIR, server, channel));
    /* note: improve */
    log_file = printf('%1/%2_%3_%4.txt', channel_dir, channel, getDate(), getTime().replace(/:/g, '-'));
    fd = FS_EXT.openSync(log_file, 'a');
    if(!log_fd[server])
	log_fd[server] = {};
    log_fd[server][channel] = fd;
}


function writeLog(server, channel, from, text){
    if(LOG_EXCLUDE.indexOf(channel) != -1)
	return;
    FS_EXT.writeSync(log_fd[server][channel], getDate() + ' ' + getTime() + ' ' + from + text + '\n');
}


function closeLog(server, channel){
    if(LOG_EXCLUDE.indexOf(channel) != -1)
	return;
    FS_EXT.closeSync(log_fd[server][channel]);
    delete log_fd[server][channel];
}
