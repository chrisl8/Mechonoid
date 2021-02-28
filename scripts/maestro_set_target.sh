#!/bin/bash
# Sends a Set Target command to a Pololu Maestro servo controller
# via its virtual serial port.
# Usage: maestro-set-target.sh DEVICE CHANNEL TARGET
# Linux example: bash maestro-set-target.sh /dev/ttyACM0 0 6000
# Mac OS X example: bash maestro-set-target.sh /dev/cu.usbmodem00234567 0 6000
# Windows example: bash maestro-set-target.sh '\\.\COM6' 0 6000
# CHANNEL is the channel number
# TARGET is the target in units of quarter microseconds.
# The Maestro must be configured to be in USB Dual Port mode.
#
# You can use the find_maestro.sh command to find the port:
# ./maestro_set_target.sh $(./find_Maestro.sh) 0 2000
#
# NOTICE that the increment is "quarter microseconds",
# so you need to multiply whatever your microseconds are by four,
# and no decimals are allowed.

byte() {
  printf "\\x$(printf "%x" "$1")"
}

if [[ -z $3 ]]; then
  printf "Usage: maestro-set-target.sh DEVICE CHANNEL TARGET\n"
  printf "Linux example: bash maestro-set-target.sh /dev/ttyACM0 0 6000\n"
  printf "\n"
  printf "CHANNEL is the channel number\n"
  printf "TARGET is the target in units of quarter microseconds.\n"
  printf "\n"
  printf "The Maestro must be configured to be in USB Dual Port mode.\n"
  printf "\n"
  printf "You can use the find_maestro.sh command to find the port:\n"
  printf "./maestro_set_target.sh \$(./find_Maestro.sh) 0 2000\n"
  printf "\n"
  printf "NOTICE that the increment is \"quarter microseconds\",\n"
  printf "so you need to multiply whatever your microseconds are by four,\n"
  printf "and no decimals are allowed.\n"
else

  DEVICE=$1
  CHANNEL=$2
  TARGET=$3

  stty raw -F "$DEVICE"

  {
    byte 0x84
    byte "$CHANNEL"
    byte $((TARGET & 0x7F))
    byte $((TARGET >> 7 & 0x7F))
  } >"$DEVICE"
fi
