[![Setup Script Test](https://github.com/chrisl8/Mechonoid/actions/workflows/setup.yml/badge.svg)](https://github.com/chrisl8/Mechonoid/actions/workflows/setup.yml)

# Mechonoid

Here is a [YouTube Video](https://youtu.be/gGNvhm3uXGA) of this project in action.

This is the code that runs my animatronic hobby project. It is designed to be configurable to work with many different robotic builds, but it is current only running on one device.

Eventually I hope to add STL files for 3D printing and instructions for building something to work with this.

## Goal

This framework of scripts, instructions, code, parts lists, and printable components will help you to easily build a mechanical "robot" of your own, complete with web interface and gamepad control.

## Target Hardware and Operating System

This is intended to run on a [Raspberry Pi 4](https://www.raspberrypi.com/products/raspberry-pi-4-model-b/) running [**Ubuntu** MATE 20.04 (LTS)](https://ubuntu-mate.org/download/arm64/focal/).  I use the [4GB](https://www.raspberrypi.com/products/raspberry-pi-4-model-b/) model, but you can try others at your own risk.
 - Memory:
   - I have **not** found that the 8GB model provides any benefit.
   - I have **not** experimented much with a 2GB model. It may work, but I don't know.
 - CPU:
   - I believe that the Pi 3 will struggle to keep up with the demands of ROS and continuous serial data transfer and processing, but I have not personally tested it.
 - The instructions will all focus on Ubuntu MATE, but the more generic "Ubuntu Server 20.04 LTS" for Raspberry Pi 4 should also work. File an issue if you discover problems making it work, or want to help improve the instructions.

The Pi is a very widely supported and readily available Single Board Computer (SBC) that runs efficiently on 5 volts that can be provided from a battery via step-down converters.

I intend to use [Robot Operating System (ROS)](https://www.ros.org/) which requires Ubuntu, not Raspbian, to be easily installed.

[Ubuntu MATE](https://ubuntu-mate.org/raspberry-pi/) provides a useful desktop environment that the default Ubuntu 20.04 for Pi does not. This GUI is especially helpful for getting WiFi and Bluetooth connections working.


## Raspberry Pi Setup

Follow the steps below:

### Install Ubuntu MATE 20.04 LTS

1. Download the [64-bit Focal version of Ubuntu for Raspberry Pi](https://ubuntu-mate.org/download/arm64/focal/) 
2. Follow the [Ubuntu MATE Raspberry Pi Installation Guide](https://ubuntu-mate.org/raspberry-pi/install/) to install Ubuntu MATE 20.04 LTS.

### Notes
 - Pick a Computer Name that you want your "robot" to be known by, as it will be seen and usd in the interface.
 - **I suggest setting "Log in automatically"** to make the robot easier to work with.
   - Just don't store sensitive information on this device.
 - I also suggest not making the login password overly complex, as you may need to use it in the field. Again, this isn't a place to keep your private data.
 - The install can stall for a **long time, LIKE HOURS** at `waiting for unattended-upgr to exit`. Just walk away from it and wait it out.

#### After Install and Boot
 - UN-check "Open Welcome when I log on." and Close the "Welcome" window.
 - If you do not want the screen to LOCK after it times out:
   - Menu -> Preferences -> Screensaver
     - UN-check "Lock screen when screensaver is active"
     - I also suggest setting Screensaver theme to "Blank screen"
 - Open up a Terminal (Menu -> System Tools -> MATE Terminal)
   - You can expand the Terminal window to fill the screen with F11 if you like 
   - See the next step, "Mechonoid Install" for what to do next...

## Mechonoid Install
There is a script to install everything.

**NOTE: This script gives your user access to run any command as root.**  
In order to access hardware such as the GPIO pins, code must run as root.
This is mean tto run on a Raspberry Pi on your robot, not a personal system with sensitive data on it.

### Run:

```
bash <(wget -qO- --no-cache -o /dev/null https://raw.githubusercontent.com/chrisl8/Mechonoid/original/setup.sh)
```

Be sure to read the instructions that the script will print at the end about editing the config files in `~/.mechonoid/`

**A reboot will be required after the first install.**

To update your code run the same script again, and it will pull down and compile anything new without erasing custom settings.

## Configuration

The program is entirely dependent upon the configuration in `~/.mechonoid/config.json5`.  

You must edit this file to describe your robot.  

A rather complex example has been placed there to give a hint as to how to make it work.

# Optional Configuration

Some various "how to" things you might want to know how to do for setup.

### Remove unused packages
This won't actually speed up the system, and the disk space they us is inconsequential, but it can speed up regular updates.  
`sudo apt remove libreoffice-base-core libreoffice-common evolution rhythmbox shotwell transmission-common`

### Upgrade the kernel
You don't need to do this, but if you did, here is how:  
`sudo apt install --install-recommends linux-generic-hwe-20.04`

### Install and run Vino to allow remote control via VNC
If you want to remote control the desktop, you can set up Vino and use VNC to connect to it.  
```
sudo apt install vino
export DISPLAY=:0
gsettings set org.gnome.Vino prompt-enabled false
gsettings set org.gnome.Vino require-encryption false
/usr/lib/vino/vino-server &
```
If you want Vino to start on boot
https://askubuntu.com/a/1062730/452730

- After startup, click the square array of dots in the lower left of the screen.
- Type 'startup applications' (no quotes) into the search box that appears at the top of the screen. Clock on the resulting icon.
- Click Add at the right of the box, Type 'start vino' in the Name box, and paste /usr/lib/vino/vino-server into the command box.
- Click Add at the bottom of the box.
- Close the app.

But be aware that if the Pi boots with no monitor attached, Vino likely won't start.



## Attributions
[Dalek Icon](https://thenounproject.com/icon/dalek-1472703/) by [Tatyana Kyul](https://thenounproject.com/kyul/) from the [Noun Project](https://thenounproject.com/).

The name [Mechonoid](https://aliens.fandom.com/wiki/Mechonoid) is a reference to a robot from the classic Doctor Who episode [The Chase](https://en.wikipedia.org/wiki/The_Chase_(Doctor_Who)).