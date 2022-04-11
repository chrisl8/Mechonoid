#!/usr/bin/env bash
# Find the Audio device with a "Master" option
# in alsa and set it to the given percent.
if [[ $# -eq 0 ]]; then
  echo "You must provide a sound file with full path."
  exit 1
fi

# Kill any already running instances
pkill -f "mplayer"
/usr/bin/mplayer "${1}"
