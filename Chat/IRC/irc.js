/* --------------------------------
 *
 * Subway IRC Client
 * The script is testing and unfinished.
 *
 * -------------------------------- */


/**
 * Other Files:
 * format.js - format message text to html elements
 * log.js - write log files
 * md5.js - MD5 library from Internet
 */


/* Note that almost all style changes is implemented by adding and removing CSS class */


/* load node.js modules */
var IRC = require('irc');
var HTTP = require('http');
var URL = require('url');
var GetMAC = require('getmac'); /* color hash */
/* node-webkit API */
var gui, win, tray, popup_menu;
/* IRC */
var server, nick, channels, client, bridge;
/* DOM */
var container, inputbox, complement, flexible_style;
/* UI */
var tabwidget, info_tab, tabs, user_list;
/* MAC Address for color hash */
var mac_addr = '';
/* save calculated color for nicks */
var color_map = {};


const TITLE = 'Subway Chat';
/* use pidgin's icons until new icons are created */
const ICON_AVAIL = 'images/pidgin-tray-available.png';
const ICON_PENDING = 'images/pidgin-tray-pending.png';

const IMAGE_FILTER = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/bmp', 'image/x-bmp'];
const IMAGE_SIZE_LIMIT = 1*1024*1024;

const COMP_MAX_LENGTH = 30;

const RAW_EXCEPTION = ['rpl_namreply', 'rpl_endofnames', 'rpl_topic', 'rpl_topicwhotime', 'PING'];
const PART_MESSAGE = '...';

const DEFAULT_SERVER = 'irc.freenode.net';
const DEFAULT_NICK = 'benzene';
const DEFAULT_CHANNELS = '#linuxba,#linuxbar,#archlinux-cn,##Orz';
const OPTIONS = {
    userName: 'nw_client',
    realName: 'nodeJS IRC client',
    port: 6667,
    localAddress: null,
    debug: true,
    showErrors: true,
    autoRejoin: false,
    autoConnect: true,
    secure: false,
    selfSigned: false,
    certExpired: false,
    floodProtection: true,
    floodProtectionDelay: 1000,
    sasl: false,
    stripColors: false,
    channelPrefixes: '&#',
    messageSplit: 512,
    encoding: ''
};


/* stackoverflow #10420352 Mark */
function humanFileSize(bytes, si){
    var thresh = si ? 1000 : 1024;
    if(bytes < thresh) return bytes + ' B';
    var units = si ? ['kB','MB','GB'] : ['KiB','MiB','GiB'];
    var u = -1;
    do {
	bytes /= thresh;
	++u;
    } while(bytes >= thresh);
    return bytes.toFixed(1)+' '+units[u];
}


/* 日期和時間相關函數將整合 */
function getTime(){
    var date = new Date();
    var hour = date.getHours();
    var minute = date.getMinutes();
    var second = date.getSeconds();
    if(hour < 10)
	hour = '0' + hour;
    if(minute < 10)
	minute = '0' + minute;
    if(second < 10)
	second = '0' + second;
    return printf('%1:%2:%3', hour, minute, second);
}


function getDate(){
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var date = date.getDate();
    if(month < 10)
	month = '0' + month;
    if(date < 10)
	date = '0' + date;
    return printf('%1-%2-%3', year, month, date);
}


/**
 * 檢測一個顏色是否符合標準
 * 若紅綠藍中有兩項大於 144 則返回假
 * @param rgb Array [R, G, B] of Number
 * @return Boolean
 */
function check_color(rgb){
    var i, count = 0;
    for(i=0; i<3; i++)
	if(rgb[i] > 144)
	    count++;
    if(count < 2)
	return true;
    return false;
}


/**
 * 用 MD5 計算給定 nick 的顏色
 * @param nick String
 * @return String '#rrggbb'
 */
function color(nick){
    if(color_map[nick])
	return color_map[nick];
    var hash = hex_md5(nick+mac_addr);
    var color_str, pos = 0;
    var rgb = [255, 255, 255];
    while(!check_color(rgb) && pos+6 <= hash.length){
	color_str = hash.slice(pos, pos+6);
	rgb[0] = parseInt(color_str[0]+color_str[1], 16);
	rgb[1] = parseInt(color_str[2]+color_str[3], 16);
	rgb[2] = parseInt(color_str[4]+color_str[5], 16);
	pos++;
    }
    return (color_map[nick] = '#' + color_str);
}


/* 清空用於 <Tab> 補全的提示 */
function empty_complement(){
	complement.textContent = '';
}


/* 進行 <Tab> 補全 */
function do_complement(){
    var head, tail, value, data = [], channel = getCurrentChannel();
    tail = inputbox.selectionStart;
    value = inputbox.value;
    if(tail >= 1 && channel && tail == inputbox.selectionEnd){
	var substr, nicks = null;
	head = (tail - COMP_MAX_LENGTH > 0)? (tail - COMP_MAX_LENGTH): 0;
	while(head < tail){
	    var matched = [];
	    substr = value.slice(head, tail);
	    /* strange, client.chans is always lower case */
	    var I, users = client.chans[channel.toLowerCase()].users;
	    for(I in users)
		if(users.hasOwnProperty(I))
		    if(I.indexOf(substr) == 0)
			matched.push(I);
	    if(matched.length != 0){
		nicks = matched;
		break;
	    }
	    head++;
	}
	var new_value, comp = null;
	if(nicks){
	    if(nicks.length == 1){
		comp = nicks[0];
		empty_complement();
	    }else{
		complement.textContent = nicks.join(' ');
		/* 如果幾個 nicks 有公共部分，那麽補全公共部分 */
		var min_index, min_len = Infinity;
		var i, j;
		for(i=0; i<nicks.length; i++){
		    if(nicks[i].length < min_len){
			min_len = nicks[i].length;
			min_index = i;
		    }
		}
		for(i=min_len; i>1; i--){
		    var common = nicks[min_index].slice(0, i);
		    var is_common = true;
		    for(j=0; j<nicks.length; j++){
			if(nicks[j].indexOf(common) != 0){
			    is_common = false;
			    break;
			}
		    }
		    if(is_common){
			comp = common;
			break;
		    }
		}
	    }
	    if(comp){
		new_value = value.slice(0, head) + comp + value.slice(tail, value.length);
		inputbox.value = new_value;
		inputbox.selectionEnd = inputbox.selectionStart = tail + comp.length - (tail - head);
	    }
	}else{
	    empty_complement();
	}
    }else{
	empty_complement();
    }
}


/* 阻止在 Inputbox 中按下 <Tab> 的默認行為（切換焦點） */
function inputbox_keydown(ev){
    if(ev.keyCode == 9)
	ev.preventDefault();
}


/* <Tab> 補全 */
function inputbox_keyup(ev){
    if(ev.keyCode == 9)
	do_complement();
}


/* 用戶登入簡陋版（待改進） */
function login(){
    server = prompt('Server:', DEFAULT_SERVER);
    nick = prompt('Nick:', DEFAULT_NICK);
    channels = prompt('Channels:', DEFAULT_CHANNELS);
}


/* 初始化 */
function init(){
    init_ui();
    init_log();
    init_bridge();
    login();
    init_client();
}


/* 初始化 UI, 創建 TabWidget */
function init_ui(){
    /* DOM 相關函數參見 subway_dom.js */
    assignGlobalObject({
	container: '#container',
	inputbox: '#inputbox',
	complement: '#complement_tip',
	flexible_style: '#flexible_style'
    });
    /* UI 相關函數參見 subway_ui.js */
    tabwidget = new Widget.TabWidget();
    container.appendChild(tabwidget.element);
    info_tab = new Widget.Widget(create('div', { className: 'info_tab' } ));
    info_tab.data.is_scroll_bottom = true;
    tabwidget.addTab(info_tab, 'INFO');
    tabwidget.on_tab_close_request = tabCloseRequested;
    /**
     * 用於存儲各個頻道（包括私聊）標籤頁的哈希表
     * tabs Object {widget Widget.Widget}
     * widget.data.channel String 頻道或私聊對方
     * widget.data.is_scroll_bottom Boolean 是否滾動到最底部
     * widget.data.scroll Number 記錄 window.scrollY
     * widget.data.user_list_widget Widget.Widget 指向對應頻道用戶列表的 Widget
     * 注：目前沒有 Layout, 標籤欄等都設為 position: fixed; 並把消息區置於頁面
     * 中滾動，暫時通過記錄滾動位置來摸拟 overflow: scroll; 的 box.
     */
    tabs = {};
    user_list = new Widget.TabWidget();
    /**
     * 此處待改進，user_list 不需要 tabBar.
     * 準備修改 TabWidget，將 tabBar 和 content 分離。
     * 搞一個 AbstractTabWidget 來實現分離和多種 TabWidget, 例如 TreeTabWidget.
     * TreeTabWidget 專門用於 multi-server.
     */
    user_list.tabBar.style.display = 'none';
    user_list.element.classList.add('user_list');
    user_list.hide();
    tabwidget.on_change = tabChanged;
    document.body.appendChild(user_list.element);
    /* 載入 node-webkit API */
    gui = require('nw.gui');
    win = gui.Window.get();
    win.display = true;
    win.title = TITLE;
    /* 創建 tray icon */
    tray = new gui.Tray({
	title: TITLE,
	icon: ICON_AVAIL,
	tooltip: TITLE
    });
    tray.on('click', function(){
	win.show(win.display = !win.display);
    });
    addListeners(inputbox, {
	change: empty_complement,
	keydown: inputbox_keydown,
	keyup: inputbox_keyup
    });
    addListeners(window, {
	/* 自動滾屏 */
	scroll: function(){
	    var widget = tabwidget.getCurrentWidget();
	    widget.data.scroll = window.scrollY;
	    widget.data.is_scroll_bottom = ((window.innerHeight + window.scrollY) >= document.body.scrollHeight);
//	    widget.data.is_scroll_bottom = ((window.innerHeight + window.scrollY) >= document.body.scrollHeight) || (window.innerHeight >= document.body.scrollHeight);
	},
	/* 設定最大行寬（受 user_list 的寬影響） */
	resize: set_max_width
    });
    /* 獲得 MAC 地址以便在不同的機器上 hash 出不同的顏色 */
    GetMAC.getMac(function(err, mac){
	if(err){
	    console.log(err);
	    return;
	}
	mac_addr = mac;
    })
    /* Developer Tools */
    popup_menu = new gui.Menu();
    var devtools_item = new gui.MenuItem({
	label: 'Debug'
    });
    devtools_item.addListener('click', function(){
	win.showDevTools();
    });
    popup_menu.append(devtools_item);
    $('html').addEventListener('contextmenu', function(ev){
	ev.preventDefault();
	popup_menu.popup(ev.x, ev.y);
	return false;
    });
}


/* 滾動到最底部 */
function scroll2bottom(){
    window.scrollTo(0, document.body.scrollHeight - window.innerHeight + 100);
}


/* 設定最大行寬 */
function set_max_width(){
    flexible_style.innerHTML = printf('.line, #complement_tip {\n\tmax-width: %1px\n}', window.innerWidth - user_list.element.offsetWidth - 20); // margin 8px
}


function tabCloseRequested(widget){
    /* info_tab 不可關閉，私聊要清理多餘的對相應 Widget 的引用，頻道則會在 part 事件處理 */
    if(widget == info_tab){
	return false;
    }else if(widget.data.pm){
	var I;
	for(I in tabs)
	    if(tabs.hasOwnProperty(I))
		if(tabs[I] == widget)
		    delete tabs[I];
	/* 私聊標籤頁的 widget.data.channel 指對方 nick */
	closeLog(server, widget.data.channel);
    }else{
	client.part(widget.data.channel, PART_MESSAGE);
    }
}


function tabChanged(widget){
    /* 滾屏，不在最底則回到原位 */
    if(widget.data.scroll){
	if(widget.data.is_scroll_bottom)
	    scroll2bottom();
	else
	    window.scrollTo(0, widget.data.scroll);
    }
    /* 移除切換到的標籤頁的高亮提示，恢復正常樣式 */
    if(widget.data.button.classList.contains('tab_button_highlight'))
	widget.data.button.classList.remove('tab_button_highlight');
    else if(widget.data.button.classList.contains('tab_button_message'))
	widget.data.button.classList.remove('tab_button_message');
    if(!checkPending())
	tray.icon = ICON_AVAIL;
    /* 不是頻道的標籤頁沒有 user list */
    if(widget.data.user_list_widget){
	user_list.element.style.display = '';
	user_list.setCurrentWidget(widget.data.user_list_widget);
    }else{
	user_list.element.style.display = 'none';
    }
    /* 不同標籤頁的 user_list 寬不同，而且有可能為零 */
    set_max_width();
}


function checkPending(){
    /* 有一個標籤頁高亮，tray icon 就要顯示為 pending */
    var buttons = $All('.tab_button_highlight');
    return Boolean(buttons.length);
}


function getCurrentChannel(){
    var widget = tabwidget.getCurrentWidget();
    if(widget.data.channel)
	return widget.data.channel;
    else
	return null;
}


function openLink(){
    gui.Shell.openExternal(this.dataset.href);
}


function genUserList(users){
    var widget = new Widget.Widget(create('div', {
	className: 'user_list_widget'
    }));
    var table = create('table', {
	className: 'user_list_table'
    });
    widget.appendChild(table);
    var head = create('th');
    table.appendChild(head);
    /* Object 是無序的，把鍵拷到數組裡進行排序 */
    var I, keys = [];
    for(I in users)
	if(users.hasOwnProperty(I))
	    keys.push(I);
    keys.sort();
    var i;
    for(i=0; i<keys.length; i++){
	I = keys[i];
	var flag = 'ordinary';
	if(users[I] == '@')
	    flag = 'op';
	else if(users[I] == '+')
	    flag = 'voice';
	var row = create('tr', {
	    textContent: I,
	    classList: ['user', flag],
	    style: {
		color: color(I)
	    },
	    /* 見 quit 事件 */
	    dataset: {
		nick: I
	    }
	});
	table.appendChild(row);
    }
    head.textContent = keys.length+((keys.length != 1)? ' users': ' user');
    return widget;
}


function updateUserList(channel){
    /* lower case, ... */
    var channel_obj = client.chans[channel.toLowerCase()];
    if(!channel_obj)
	return;
    /* handle strange nick changing problem */
    var I, users = channel_obj.users;
    for(I in users)
	if(users.hasOwnProperty(I))
	    if(typeof users[I] == 'undefined')
		delete users[I]
    var widget = genUserList(users);
    user_list.replaceWidget(tabs[channel].data.user_list_widget, widget);
    tabs[channel].data.user_list_widget = widget;
}


function lowerCase2original(channel){
    var I;
    for(I in tabs)
	if(tabs.hasOwnProperty(I))
	    if(I.toLowerCase() == channel)
		return I;
    return channel;
}


function init_bridge(){
    /* node.js 無法直接訪問 DOM, 所以造一個對象綁在 client 對象上 */
    bridge = {
	/**
	 * 消息處理函數，將消息格式化顯示在屏幕上
	 * @param tag Object {text String (e.g. nick), color String optional}
	 * @param text String
	 * @param flags Array of String （對應 CSS Class）
	 * @param tab String 顯示消息的標籤頁（tabs 哈希表的鍵）
	 * @return undefined
	 */
	add: function(tag, text, flags, tab){
	    var label_date = create('span', {
		textContent: printf('(%1) ', getTime()),
		className: 'label_date',
		style: {
		    color: tag.color || ''
		}
	    });
	    var label_tag = create('span', {
		textContent: tag.text,
		className: 'label_tag',
		style: {
		    color: tag.color || ''
		}
	    });
	    /* 從文本生成 HTML Elements, 參見 format.js */
	    var text_blocks = format(text);
	    /* 處理鏈接和行内圖片 */
	    var i;
	    for(i=0; i<text_blocks.length; i++){
		if(text_blocks[i].classList.contains('link')){
		    /* href 需要用 node-webkit 的 API 打開 */
		    /* 此處多此一舉，待改進 format.js 直接使用 dataset.href */
		    var href = text_blocks[i].href;
		    text_blocks[i].href = 'javascript:void(0);';
		    text_blocks[i].dataset.href = href;
		    text_blocks[i].addEventListener('click', openLink);
		    /* 發送 HEAD 請求，得到 content-type 判斷鏈接是否是圖片 */
		    var url = URL.parse(href);
		    if(url.protocol == 'http:' || url.protocol == 'https:'){
			var requset = HTTP.request({
			    method: 'HEAD',
			    host: url.host,
			    path: url.path,
			    port: url.port || 80
			}, function(res){
			    var head = res.headers;
			    if(IMAGE_FILTER.indexOf(head['content-type']) != -1
			       && (head['content-length'] <= IMAGE_SIZE_LIMIT
				   || !head['content-length'] ) ){
				var img = create('img', {
				    src: this.full_url,
				    textContent: '(Loading)',
				    className: 'inline_image',
				    onload: function(){
					this.textContent = '';
				    }
				});
				this.link.textContent = '';
				this.link.appendChild(img);
			    }
			    this.link.title = printf('type:%1 size:%2', head['content-type'], humanFileSize(head['content-length']));
			});
			requset.on('error', function(err) {
			    this.destroy();
			    console.log(err);
			    this.link.title = '(Error) ' + err.message;
			});
			requset.link = text_blocks[i];
			requset.full_url = href;
			requset.end();
		    }
		}
	    }
	    var label_text = create('span', {
		className: 'label_text',
		children: text_blocks
	    });
	    var flags = flags.concat();
	    flags.push('line');
	    var new_line = create('div', {
		classList: flags,
		children: [label_date, label_tag, label_text]
	    });
	    var widget;
	    if(tab){
		if(tabwidget.isWidgetInTabs(tabs[tab]))
		    widget = tabs[tab];
		writeLog(server, tab, tag.text, text);
	    }else{
		widget = info_tab;
	    }	    
	    if(widget){
		var is_bottom = widget.data.is_scroll_bottom;
		/* 添加新的消息行 */
		widget.appendChild(new_line);
		if(tabwidget.isWidgetCurrent(widget)){
		    if(is_bottom)
			scroll2bottom();
		}else{
		    /* 消息提示：標籤頁文字顏色和通知區域圖標 */
		    if(flags.indexOf('highlight') != -1){
			widget.data.button.classList.add('tab_button_highlight');
			if(tray.icon != ICON_PENDING)
			    tray.icon = ICON_PENDING;
		    }
		    else if(flags.indexOf('message') != -1)
			widget.data.button.classList.add('tab_button_message');
		}
	    } // if(widget)
	} // add
    }; // bridge
}


/**
 * 初始化 client, 綁定各種事件
 * IRC Module 的文檔：https://node-irc.readthedocs.org/en/latest/API.html
 */
function init_client(){
    /* 創建 client 對象，綁上 bridge */
    client = new IRC.Client(server, nick, OPTIONS);
    client.bridge = bridge;

    /* 連上後加入各個頻道 */
    client.addListener('registered', function(){
	console.log('Connected!');
	this.bridge.add({text: '[INFO] '}, 'Connected', ['info']);
	this.join(channels);
    });

    /* 過濾 server 而非用戶發來的消息並顯示一部分到 info_tab */
    client.addListener('raw', function(message){
	if(!message.nick && RAW_EXCEPTION.indexOf(message.command) == -1 && message.commandType != 'error'){
	    var text;
	    var args = message.args;
	    /* args[0] == client.nick */
	    args.shift();
	    text = args.join(' ');
	    this.bridge.add({text: '[INFO] '}, text, ['info']);
	}
    });

    /* 只有在加入頻道時 server 才會發 names list, 變化需自己處理 */
    client.addListener('names', function(channel, nicks){
	var widget = genUserList(nicks);
	tabs[channel].data.user_list_widget = widget;
	user_list.addTab(widget);	
    });

    client.addListener('topic', function(channel, topic, nick, message){
	this.bridge.add({text: '[TOPIC] '},
			printf('%1 - set by %2', topic, nick),
			['topic'], channel);
    });

    
    client.addListener('message', function(from, to, text, message){
	event_message(from, to, text, message);
    });

    /* notice 和普通消息一並處理 */
    client.addListener('notice', function(from, to, text, message){
	event_message(from, to, text, message, true);
    });

    /* action */
    client.addListener('ctcp-privmsg', function(from, to, text, message){
	var flags = ['message', 'action'];
	var arr = text.split(' ');
	var head = arr.shift();
	text = arr.join(' ');
	if(text.indexOf(client.nick) != -1)
	    flags.push('highlight');
	if(head == 'ACTION' && tabs[to])
	    this.bridge.add({text: printf('***%1 ', from),
			     color: color(from)},
			    text, flags, to);
    });

    client.addListener('join', function(channel, nick, message){
	if(nick == client.nick){
	    var new_tab = new Widget.Widget(create('div', {
		className: 'channel_tab'
	    }));
	    new_tab.data.channel = channel;
	    new_tab.data.is_scroll_bottom = true;
	    tabs[channel] = new_tab;
	    tabwidget.addTab(new_tab, channel);
	    openLog(server, channel);
	}else{
	    updateUserList(channel);
	}
	this.bridge.add({text: '[INFO] '},
			printf('%1 joined %2', nick, channel),
			['info_user', 'user_join'], channel);
    });

    client.addListener('quit', function(nick, reason, channels, message){
	if(!reason)
	    reason = '(Quit)';
	var i;
	for(i=0; i<channels.length; i++){
	    /* channels is lower case */
	    channels[i] = lowerCase2original(channels[i]);
	    /*
	     * 參數裡的 channels 是 client 加入的頻道，因此顯示消息需要判斷
	     * 該用戶是否加入了此頻道，只有加入了的頻道才顯示退出消息
	     */
	    var user_list = tabs[channels[i]].data.user_list_widget;
	    var selector = printf('.user[data-nick="%1"]', nick);
	    if(!user_list.element.querySelector(selector))
		continue;
	    updateUserList(channels[i]);
	    this.bridge.add({text: '[INFO] '},
			    printf('%1 left %2 - %3', nick, channels[i], reason),
			    ['info_user', 'user_quit'], channels[i]);
	}
    });
    
    client.addListener('part', function(channel, nick, reason, message){
	if(!reason)
	    reason = '(Part)';
	if(nick == client.nick){
	    var widget = tabs[channel];
	    user_list.removeTab(widget.data.user_list_widget);
	    if(tabwidget.isWidgetInTabs(widget))
		tabwidget.removeTab(widget);
	    delete tabs[channel];
	    closeLog(server, channel);
	}else{
	    this.bridge.add({text: '[INFO] '},
			    printf('%1 left %2 - %3', nick, channel, reason),
			    ['info_user', 'user_leave'], channel);
	    /* it is necessary to run it asynchronously */
	    /* client.chans[channel].users hasn't been updated now */
	    setTimeout(updateUserList, 0, channel);
	}
    });

    client.addListener('kick', function(channel, nick, by, reason, message){
	if(!reason)
	    reason = '(Kick)';
	if(nick == client.nick){
	    var widget = tabs[channel];
	    user_list.removeTab(widget.data.user_list_widget);
	    if(tabwidget.isWidgetInTabs(widget))
		tabwidget.removeTab(widget);
	    delete tabs[channel];
	    closeLog(server, channel);
	    this.bridge.add({text: '[INFO] '},
			    printf('kicked by %1 at %2 - %3', by, channel, reason),
			    ['info', 'info_user', 'user_kick']);
	}else{
	    this.bridge.add({text: '[INFO] '},
			    printf('%1 was kicked by %2 - %3', nick, by, reason),
			    ['info_user', 'user_kick'], channel);

	}
    });

    client.addListener('nick', function(old_nick, new_nick, channels, message){
	var i;
	for(i=0; i<channels.length; i++){
	    var channel = lowerCase2original(channels[i]);
	    updateUserList(channel);
	    this.bridge.add({text: '[INFO] '},
			    printf('%1 is now known as %2', old_nick, new_nick),
			    ['info_user', 'user_change_nick'], channel);
	}
    });

    client.addListener('+mode', function(channel, by, mode, argument, message){
	event_mode(channel, by, mode, argument, message);
    });

    client.addListener('-mode', function(channel, by, mode, argument, message){
	event_mode(channel, by, mode, argument, message);
    });

    client.addListener('error', function(err){
	var flags = ['info_error'];
	var args = err.args.concat();
	/* args[0] == client.nick */
	args.shift();
	var channel = getCurrentChannel();
	if(!channel)
	    flags.push('info');
	this.bridge.add({text: '[ERROR] '}, args.join(' '), flags, channel);
    });

    /* 發送消息或命令 */
    inputbox.addEventListener('keyup', function(ev){
	if(ev.keyCode == 13){
	    ev.preventDefault();
	    var text = this.value;
	    if(!text)
		return;
	    var head = text.slice(0, 5);
	    if(text[0] != '/' || head == '/say ' || head == '/msg '){
		var channel = getCurrentChannel();
		if(!text)
		    return;
		if(head != '/msg '){
		    if(!channel)
			return;
		    if(head == '/say '){
			text = text.slice(5, text.length);
			if(!text)
			    return;
		    }
		    client.say(channel, text);
		    bridge.add({text: client.nick + ': ',
				color: color(client.nick)},
			       text, ['message'], channel);
		}else{
		    var arr = text.split(' ');
		    arr.shift();
		    var target = arr.shift();
		    text = arr.join(' ');
		    if(!target || !text)
			return;
		    if(!tabs[target])
			add_pm_tab(target);
		    tabwidget.setCurrentWidget(tabs[target]);
		    client.say(target, text);
		    bridge.add({text: client.nick + ': ',
				color: color(client.nick)},
			       text, ['message', 'private_message'], target);
		}
		this.value = '';
	    }else{
		var args = text.split(' ');
		if(args[0].length <= 1)
		    return;
		args[0] = args[0].slice(1, args[0].length);
		client.send.apply(client, args);
		this.value = '';
	    }
	}
	return false;
    });
}


/* 建立私聊的標籤頁, 跟頻道略有不同 */
function add_pm_tab(from){
    var new_tab = new Widget.Widget(create('div', {
	classList: ['channel_tab', 'private_message_tab']
    }));
    new_tab.data.pm = true;
    new_tab.data.channel = from;
    new_tab.data.is_scroll_bottom = true;
    tabs[from] = new_tab;
    tabwidget.addTab(new_tab, from);
    openLog(server, from);
}


/* notice 和普通消息一並處理 */
function event_message(from, to, text, message, notice){
    var flags = ['message'];
    if(notice)
	flags.push('notice');
    if(tabs[to]){	
	if(text.indexOf(client.nick) != -1)
	    flags.push('highlight');
	if(notice && !from){
	    /* 不知是從誰來，那就是從 server 來 */
	    flags.push('info');
	    this.bridge.add({text: '[INFO] '}, text, flags, to);
	}else{
	    this.bridge.add({text: from + ': ',
				 color: color(from)},
				text, flags, to);
	}
    }else if(to == client.nick){
	/* 私聊 */
	flags.push('highlight');
	flags.push('private_message');
	/* 開啓標籤頁（私聊標籤頁可能是自己開的，也有可能是收到別人消息開的） */
	if(!tabs[from]){
	    add_pm_tab(from);
	}
	this.bridge.add({text: from + ': ',
			 color: color(from)},
			text, flags, from);
    }
}


function event_mode(channel, by, mode, argument, message){
    /* strange, argument is empty when +q */
    var args = message.args;
    channel = args.shift();
    /* including '+' and '-' */
    mode_ = args.shift();
    if(args.length)
	argument = ' ' + args.join(' ');
    else
	argument = '';
    var text = printf('mode (%1%2) set by %3', mode_, argument, by);
    this.bridge.add({text: '[INFO] '},
		    text, ['info_user', 'mode_set', 'mode_add'], channel);
}
