# Robot Anything

## Work in Progress

This really isn't ready for public consumption yet.

## Raspberry Pi Setup

This is intended to run on a Raspberry Pi 4 running **Ubuntu**.  I use the 4GB model, but you can try others at your own risk. 

TL;DR: Put a fresh copy of Ubuntu 20.04 LTS on your robot's Raspberry Pi then run the installation script.

Follow the steps below:

### Install Ubuntu
See: https://ubuntu.com/tutorials/how-to-install-ubuntu-on-your-raspberry-pi#1-overview for full instructions.
 
Summary:

- Install and launch the Raspberry Pi OS Imager
    - For Linux it goes like this:
      `sudo dpkg -i ./imager_1.5_amd64.deb`
      `sudo apt --fix-broken install`
      - Launch from Ubuntu Desktop menu
    - For Windows, just install and run it.
- Pick
  - Other general purpose OS
    - Ubuntu
      - Ubuntu Server 20.04.3 LTS 64-bit
        - This is the one with no desktop, because we don’t need that.
    
### Enable WiFi for headless boot

Enable Wifi on boot without Display
Ubuntu:  
https://ubuntu.com/tutorials/how-to-install-ubuntu-on-your-raspberry-pi#3-wifi-or-ethernet


In the “system-boot” mounted volume edit a file called `network-config`:

![Screenshot%20from%202020-02-13%2016-09-42](https://ubuntucommunity.s3.dualstack.us-east-2.amazonaws.com/optimized/2X/5/5313728482a5817454c6ec7991e615f622015d8c_2_690x423.png)


Edit the `network-config` file to add your Wi-Fi credentials. An example is already included in the file, you can simply adapt it.
To do so, uncomment (remove the “#” at the beginning) and edit the following lines:

    wifis:
      wlan0:
        dhcp4: true
        optional: true
        access-points:
          <wifi network name>:
            password: "<wifi password>"

For example:

    wifis:
      wlan0:
        dhcp4: true
        optional: true
        access-points:
          "home network":
            password: "123456789"
> Note: network name **must** be enclosed in quotation marks, even though the example does not demonstrate this.

Save the file and extract the card from your laptop.

> Note: During the first boot, your Raspberry Pi will try to connect to this network. It will fail the first time around.
> 
> To deal with this **either**:  
> A. Once it seems done, pull the power cable and plug it in again, and it should connect this time.  
> or  
> B. Connect an Ethernet cable to use to connect to it after the first boot, SSH to it, and reboot it right away to make WiFi work.

MY experience is that the way to reliably get the OS to work consitently and connect to Wifi is to  
connect a keyboard and monitor (to HDMI 0, not 1),
let it finish booting,
leave it alone for five or ten minutes to make sure it is done,
(Note: It actually creates the ubuntu account during the first boot, so it is possible to try logging in before he account exists, which won't work)
log in as ubuntu/ubunut,
change your pasword as required,
and reboot.

Trying to just unplug it and plug it in and get it on Wifi seems to only work sometimes.

### Log in

Initial username/password is ubuntu and ubuntu. It should make you change the password, but if not, do it.

### Change hostname

The hostname on the Pi is used for connecting to the web interface.  

I find it to be helpful to change it to something meaningful by  
editing `/etc/hostname` and then rebooting.

## RobotAnywhere Install
There is a script to install everything. Run:

```
bash <(wget -qO- --no-cache -o /dev/null https://raw.githubusercontent.com/chrisl8/RobotAnything/original/setup.sh)
```

Be sure to read the instructions that the script will print at the end about editing the config files in `~/.RobotAnything/`

**A reboot will be required after the first install.**

To update your code run the same script again, and it will pull down and compile anything new without erasing custom settings.

## Configuration

The program is entirely dependent upon the configuration in ~/.robotAnywhere/config.json  

You must edit this file to describe your robot.  

A rather complex example has been placed there to give a hint as to how to make it work.

Other examples can be found with the names `configExample*.json`

## Attributions
Dalek Icon by Tatyana Kyul from the Noun Project
