#!/usr/bin/env bash

# Unfortunately the program has to run as root to use the GPIO library that I'm using
sudo bash -ic "pm2 stop Robot;true"
