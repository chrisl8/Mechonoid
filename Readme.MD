[![Setup Script Test](https://github.com/chrisl8/Mechonoid/actions/workflows/setup.yml/badge.svg)](https://github.com/chrisl8/Mechonoid/actions/workflows/setup.yml)

# Mechonoid

Here is a [YouTube Video](https://youtu.be/gGNvhm3uXGA) of this project in action.

This is the code that runs my animatronic hobby project. It is designed to be configurable to work with many different robotic builds, but it is current only running on one device.

Eventually I hope to add STL files for 3D printing and instructions for building something to work with this.

## Goal

This framework of scripts, instructions, code, parts lists, and printable components will help you to easily build a mechanical "robot" of your own, complete with web interface and gamepad control.

## Target Hardware and Operating System

This is intended to run on a [Raspberry Pi 4](https://www.raspberrypi.com/products/raspberry-pi-4-model-b/) running [**Ubuntu** Desktop 22.04 (LTS)](https://ubuntu.com/tutorials/how-to-install-ubuntu-desktop-on-raspberry-pi-4).  I use the [4GB](https://www.raspberrypi.com/products/raspberry-pi-4-model-b/) model, but you can try others at your own risk.
 - Memory:
   - I have **not** found that the 8GB model provides any benefit.
   - I have **not** experimented much with a 2GB model. It may work, but I don't know.
 - CPU:
   - If you already have a Pi 3, try it. If you are buying a new board, I would not buy a Pi 3 now. I believe that the Pi 3 will struggle to keep up with future demands.

The Pi is a very widely supported and readily available Single Board Computer (SBC) that runs efficiently on 5 volts that can be provided from a battery via step-down converters.

I **someday** intend to use [Robot Operating System (ROS)](https://www.ros.org/) which requires Ubuntu, not Raspbian, to be easily installed.

[Ubuntu Desktop](https://ubuntu.com/tutorials/how-to-install-ubuntu-desktop-on-raspberry-pi-4) provides a useful desktop environment. This GUI is especially helpful for getting WiFi and Bluetooth connections working. My experience is that most people struggle with a "Server" only headless version of Ubuntu, but if you want to use the Server version of Ubuntu it should work exactly the same. You will just be on your own for getting WiFi set up and such.

## Raspberry Pi notes
I highly suggest purchasing a basic "kit" from [CanKit](https://www.canakit.com/). You can get them on Amazon and from many local retailers like Best Buy, or directly from their site. They provide excellent support. (I have had to RMA a bad Pi before, and they were easy to work with!) They also provide quality components.

**Do** get a good quality power supply with your Pi, again, preferably as part of a CanaKit. The Pi 2 worked **OK** with an old phone charger (although they notoriously would reset when plugging in USB peripherals if your power supply was poor), but the Pi 4 is **NOT** going to work reliably with a junk power supply.

If you have never touched or used a Raspberry Pi before, definitely read over their own getting started materials here: https://www.raspberrypi.com/documentation/computers/getting-started.html


## Raspberry Pi Setup

Follow the steps below:

### Install Ubuntu Desktop 22.04 LTS

1. Download the latest [Raspberry Pi Imager](https://www.raspberrypi.com/software/) for your computer's Operating System.
2. Install it and pick Ubuntu Desktop 22.04  
   For my Pi 4 4GB model pick: Other general purpose OS→Ubuntu→Ubuntu Desktop 22.04.1 LTS (RPi 4/400) 64-bit from
    - Note that the last '.1' part of the version number may be newer, that is fine.
    - If you are trying this on a Pi 3 I suggest using the Server 32-bit version, but remember that you won't have a desktop for setting up WiFi and such if you do that.
3. Once the install is done put the SD card into the Pi and power it on.

The OS setup should be self explanatory, but here are a few notes:

### Initial Ubuntu Setup Notes
 - If in doubt, just pick the defaults. Nothing here is forever.
 - The "Where are you?" is just about your timezone, so just stick with the "major city" for your Time Zone.
 - Pick a Computer Name that you want your "robot" to be known by, as it will be seen and usd in the interface.
 - **I suggest setting "Log in automatically"** to make the robot easier to work with.
   - Just don't store sensitive information on this device.
 - I also suggest not making the login password overly complex, as you may need to use it in the field. Again, this isn't a place to keep your private data.

#### After Install and Boot
 - There is a box that comes up asking about connecting to services, "Live Upgrade", etc. You can just skip all of this stuff.
 - When it asks to install updates go ahead and do it now. 
   - The Mecahnoid setup script will also do it, but it takes a long time and it is nice to get it done now with the GUI rather than later.
   - Be sure to wait for it to finish and let it reboot before proceeding further.
 - If you do not want the screen to LOCK after it times out:
   - Menu/"Show Applications" -> Settings -> Privacy -> Screen
     - UN-check "Automatic Screen Lock"
 - Open up a Terminal (Menu/"Show Applications -> Terminal)
   - You can expand the Terminal window to fill the screen with F11 if you like 
   - See the next step, "Mechonoid Install" for what to do next...

## Mechonoid Install
There is a script to install everything.

**NOTE: This script gives your user access to run any command as root.**  
In order to access hardware such as the GPIO pins, code must run as root.
This is meant to run on a Raspberry Pi on your robot, not a personal system with sensitive data on it.

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
This won't actually speed up the system, and the disk space they use is inconsequential, **but it can speed up system updates**:  
```
sudo apt remove libreoffice-base-core libreoffice-common evolution rhythmbox shotwell transmission-common thunderbird
sudo apt autoremove
```

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