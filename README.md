# Subway Project Experimental Repository
## The first application: IRC Client (Semi Finished)
### Dependencies
#### Implementation
 - node-webkit (nw.js)

#### Node.js modules
 - irc
 - getmac
 - fs-extra

### Feature
- highlight line background
- inline image
- nickname complement
- plain text log
- colorful nicknames

### Test
<pre>
$ git clone https://github.com/SubwayDesktop/Subway
$ cd Subway/Chat/IRC
$ nw .
</pre>
### Note
#### Layout
The UI layout of the application is now built by fixed position elements. Better layout will be built soon.

Some bugs related to the layout can also be fixed soon.
#### Art
Tray icons are from pidgin. New icons are required.

### Roadmap

#### Bug fix
- define disconnected behaviour
- highlight pending at current tab

#### Requirement
- user settings (e.g. SSL)
- multi-server
- channel list

#### Feature
- image in proper size
- tip at new day
- shortcut