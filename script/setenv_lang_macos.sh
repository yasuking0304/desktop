#!/bin/sh
# see https://github.com/yasuking0304/SetEnv-Lang-MacOS

DIR=$HOME"/Library/LaunchAgents"
LABEL="setenv.LANG"
FILE=$DIR"/"$LABEL".plist"

if [ ! -d $DIR ]; then
  echo 'mkdir '$DIR
  mkdir -p $DIR
fi
if [ -f $FILE ]; then
  echo 'unload '$FILE
  launchctl unload $FILE
  rm -f $FILE
fi
echo '<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>'$LABEL'</string>
    <key>ProgramArguments</key>
    <array>
      <string>/bin/launchctl</string>
      <string>setenv</string>
      <string>LANG</string>
      <string>'$LANG'</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>ServiceIPC</key>
    <false/>
  </dict>
</plist>
' > $FILE
plutil -lint $FILE 
echo 'load '$FILE
launchctl load $FILE

exit $?
