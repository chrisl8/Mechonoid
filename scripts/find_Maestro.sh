#!/usr/bin/env bash

# This will find the Maestro controller.
# This is currently hard coded to the 18.
# In the future I may want to provide options for other models.

# The Maestro has TWO ports, but the first is always the one I want,
# so this works.

# Grab and save the path to this script
# http://stackoverflow.com/a/246128
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  DIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
SCRIPTDIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"
# echo "${SCRIPTDIR}" # For debugging

node "${SCRIPTDIR}/../node/UsbDevice.js" "Pololu_Mini_Maestro_18-Channel_USB_Servo_Controller" ID_MODEL
