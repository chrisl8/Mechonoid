#!/usr/bin/env bash

# Grab and save the path to this script
# http://stackoverflow.com/a/246128
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  DIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
SCRIPT_DIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"
# echo "${SCRIPT_DIR}" # For debugging

# This has to be run at EVERY boot to allow Xbox One controllers to connect
# via Bluetooth
sudo bash -ic "echo 'Y' > /sys/module/bluetooth/parameters/disable_ertm"

# Unfortunately the program has to run as root to use the GPIO library that I'm using
sudo bash -ic "cd ${SCRIPT_DIR}/node;pm2 start ${SCRIPT_DIR}/node/pm2Config.json;cd"
