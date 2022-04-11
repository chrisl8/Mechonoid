#!/usr/bin/env bash
# shellcheck disable=SC2059 disable=SC2129
# Run this on you Raspberry Pi to make everything work!

GIT_REPO_AND_FOLDER=Mechonoid
CONFIG_FOLDER_NAME=mechonoid

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
#PURPLE='\033[0;35m'
YELLOW='\033[1;33m'
LIGHTCYAN='\033[1;36m'
#LIGHTBLUE='\033[1;34m'
LIGHT_PURPLE='\033[1;35m'
BRIGHT_WHITE='\033[1;97m'
NC='\033[0m' # NoColor

printf "\n${YELLOW}[Checking Architecture, OS and Version]${NC}\n\n"
if ! (grep "DISTRIB_ID=Ubuntu" /etc/lsb-release >/dev/null) || ! (grep "DISTRIB_RELEASE=20.04" /etc/lsb-release >/dev/null) || ! (grep "DISTRIB_CODENAME=focal" /etc/lsb-release >/dev/null); then
  printf "${RED}[This script will only work on Ubuntu Focal (20.04)!!]${NC}\n"
  printf "${RED}https://github.com/chrisl8/${GIT_REPO_AND_FOLDER}${NC}\n"
  exit 1
fi

if [[ ${USER} == "root" ]]; then
  printf "\n${RED}[This script must not be run as root]${NC}\n"
  printf "${RED}exit root back to your normal user and try again.${NC}\n"
  exit 1
fi

IS_RASPBERRY_PI=false
if (grep "Raspberry Pi" /proc/cpuinfo >/dev/null); then
  IS_RASPBERRY_PI=true
fi

if ! [[ ${IS_RASPBERRY_PI} == "true" ]]; then
  printf "\n${YELLOW}This is ONLY meant to work on a Raspberry Pi!${NC}\n"
  printf "If you continue the install, expect problems!\n"
  if ! [[ ${CI} == "true" ]]; then # Never ask questions in test environment
    printf "${BRIGHT_WHITE}"
    read -n 1 -s -r -p "Do you want to continue? (y or n) " CONTINUE_ANYWAY
    printf "${NC}\n"
    if ! [[ ${CONTINUE_ANYWAY} == "y" ]]; then
      exit 1
    fi
  fi
fi

if ! (sudo -nl | grep "(ALL) NOPASSWD: ALL" >/dev/null); then
  printf "\n${YELLOW}[Setting up ${USER} to run any command as root without password entry.]${NC}\n"
  printf "${LIGHTCYAN}Remember, this is meant to run on a Pi on a battery powered platform.${NC}\n"
  printf "${LIGHTCYAN}Without this the code cannot access hardware such as the GPIO pins.${NC}\n"
  # Sometimes an old version gets left over and breaks future code runs.
  if [[ -e /tmp/"${USER}"_sudoers ]]; then
    sudo rm /tmp/"${USER}"_sudoers
  fi
  echo "${USER} ALL=(ALL) NOPASSWD:ALL" >/tmp/"${USER}"_sudoers
  chmod 0440 /tmp/"${USER}"_sudoers
  sudo chown root:root /tmp/"${USER}"_sudoers
  sudo mv /tmp/"${USER}"_sudoers /etc/sudoers.d/"${USER}"
  sudo chown root:root /etc/sudoers.d/"${USER}"
fi

printf "\n${YELLOW}[Updating & upgrading all existing Ubuntu packages]${NC}\n"
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y

PACKAGE_TO_INSTALL_LIST=()
PACKAGE_TO_INSTALL_LIST+=(git)
#git - It is unlikely that you got this far without git, but just in case.
PACKAGE_TO_INSTALL_LIST+=(wget)
#wget is required to install Node Version Manager (nvm)
PACKAGE_TO_INSTALL_LIST+=(unzip)
#unzip is required to extract downloaded packages for installation
PACKAGE_TO_INSTALL_LIST+=(build-essential)
#build-essential includes things like make and libraries required to build the GPIO tools
PACKAGE_TO_INSTALL_LIST+=(openssh-server)
#openssh-server is helpful for remotely controlling the Raspberry Pi
PACKAGE_TO_INSTALL_LIST+=(joystick)
#joystick For remote control!

if [[ ${IS_RASPBERRY_PI} == "true" ]]; then
  PACKAGE_TO_INSTALL_LIST+=(rpi.gpio-common)
  #rpi.gpio-common - Required to use the GPIO pins in Ubuntu
  PACKAGE_TO_INSTALL_LIST+=(libraspberrypi-bin)
  #libraspberrypi-bin provides extra commands for working with the Raspberry Pi specifically.
fi

printf "\n${YELLOW}[Installing additional Ubuntu and ROS Packages for ${GIT_REPO_AND_FOLDER}]${NC}\n"
printf "${LIGHTCYAN}This runs every time, in case new packages were added.${NC}\n"
sudo apt install -y "${PACKAGE_TO_INSTALL_LIST[@]}"

if ! (command -v pigpiod >/dev/null); then
  printf "\n${YELLOW}[Installing pigpio for GPIO pin access]${NC}\n"
  cd
  wget https://github.com/joan2937/pigpio/archive/master.zip
  unzip -o master.zip
  rm master.zip
  cd pigpio-master/
  make
  sudo make install
  cd
  sudo rm -rf pigpio-master
fi

if ! (command -v jrk2cmd >/dev/null); then
  # TODO: This should maybe be optional?
  printf "\n${YELLOW}[Installing jrk2cmd for Pololu Jrk Motor Controller interaction]${NC}\n"
  cd
  wget https://www.pololu.com/file/0J1501/pololu-jrk-g2-1.4.0-linux-rpi.tar.xz
  tar xvf pololu-jrk-g2-1.4.0-linux-rpi.tar.xz
  rm pololu-jrk-g2-1.4.0-linux-rpi.tar.xz
  cd pololu-jrk-g2-1.4.0-linux-rpi/
  sudo ./install.sh
  cd
  rm -rf pololu-jrk-g2-1.4.0-linux-rpi
  printf "${PURPLE}Jrk Motor Controller interaction will probably not work until after you reboot${NC}\n"
fi

printf "\n${YELLOW}[Cloning or Updating git repositories]${NC}\n"
cd

printf "${LIGHTCYAN}${GIT_REPO_AND_FOLDER} repository${NC}\n"
if ! [[ -d ${HOME}/${GIT_REPO_AND_FOLDER} ]]; then
  git clone https://github.com/chrisl8/${GIT_REPO_AND_FOLDER}.git
else
  cd "${HOME}"/${GIT_REPO_AND_FOLDER}
  if (git remote -v | grep https >/dev/null); then
    # Only perform an update if the repo has an https remote address.
    # Otherwise it was probably modified by the user and shouldn't be updated.
    git pull
  else
    printf "${YELLOW}Skipping update of ${GIT_REPO_AND_FOLDER} repository due to this being a Unison synced copy.${NC}\n"
  fi
fi

if ! (id | grep dialout >/dev/null); then
  printf "\n${GREEN}Adding your user to the 'dialout' group for GPIO pin access.${NC}\n"
  printf "${GREEN}Since the service runs as root, this is not technically required,${NC}\n"
  printf "${GREEN}but testing can be frustrating if you didn't know to do this.${NC}\n"
  sudo adduser "${USER}" dialout >/dev/null
  printf "${RED}You may have to reboot before you can use GPIO pins.${NC}\n"
fi

printf "\n${YELLOW}[Installing and Initializing the Current Node LTS version]${NC}\n"

if [[ -e ${HOME}/.nvm/nvm.sh ]]; then
  printf "\n${LIGHTCYAN}Deactivating existing Node Version Manager:${NC}\n"
  export NVM_DIR="${HOME}/.nvm"
  # shellcheck source=/home/chrisl8/.nvm/nvm.sh
  [[ -s "$NVM_DIR/nvm.sh" ]] && . "$NVM_DIR/nvm.sh" # This loads nvm
  nvm deactivate
fi

# The entire thing must run as root in order to access the GPIO pins,
# so setting up root to do this
printf "\n${LIGHTCYAN}Installing Node Version Manager as root:${NC}\n"
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | sudo bash

printf "\n${LIGHTCYAN}Installing latest Node LTS version as root:${NC}\n"
sudo bash -ic "nvm install --lts;true"

printf "\n${LIGHTCYAN}Installing pm2 for running service as root:${NC}\n"
sudo bash -ic "npm install pm2@latest -g;true"

# We will do as much setup and such as we can locally though.
printf "\n${LIGHTCYAN}Installing Node Version Manager as ${USER}:${NC}\n"
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
export NVM_DIR="${HOME}/.nvm"
# shellcheck source=/home/chrisl8/.nvm/nvm.sh
[[ -s "$NVM_DIR/nvm.sh" ]] && . "$NVM_DIR/nvm.sh" # This loads nvm

export NVM_SYMLINK_CURRENT=true
if ! (grep NVM_SYMLINK_CURRENT ~/.bashrc >/dev/null); then
  printf "\n${YELLOW}[Setting the NVM current environment in your .bashrc file]${NC}\n"
  sh -c "echo \"export NVM_SYMLINK_CURRENT=true\" >> ~/.bashrc"
fi

printf "\n${LIGHTCYAN}Installing latest Node LTS version as ${USER}:${NC}\n"
nvm install --lts
nvm alias default node

cd "${HOME}/${GIT_REPO_AND_FOLDER}/node"
printf "\n${YELLOW}[Grabbing node dependencies for Node.js scripts]${NC}\n"
printf "${LIGHTCYAN}You may get some errors here, that is normal. As long as things work, it is OK.$NC\n"
npm ci

cd "${HOME}/${GIT_REPO_AND_FOLDER}/website"
printf "\n${YELLOW}[Grabbing node dependencies for React website]${NC}\n"
npm ci
printf "\n${YELLOW}[Building React website]${NC}\n"
npm run build

if ! (crontab -l >/dev/null 2>&1) || ! (crontab -l | grep startService >/dev/null 2>&1); then
  printf "\n${YELLOW}[Adding cron job to start server on system reboot.]${NC}\n"
  # https://stackoverflow.com/questions/4880290/how-do-i-create-a-crontab-through-a-script
  (
    echo "@reboot ${HOME}/${GIT_REPO_AND_FOLDER}/startService.sh > ${HOME}/crontab.log"
  ) | crontab -
fi

if ! [[ -d ${HOME}/.${CONFIG_FOLDER_NAME} ]]; then
  printf "\n${YELLOW}[Creating config folder.]${NC}\n"
  cd
  mkdir .${CONFIG_FOLDER_NAME}
fi

NEW_CONFIG=0

if ! [[ -f ${HOME}/.${CONFIG_FOLDER_NAME}/config.json5 ]]; then
  NEW_CONFIG=1
  printf "\n${YELLOW}[Creating example config data.]${NC}\n"
  cd "${HOME}/.${CONFIG_FOLDER_NAME}"
  cp "${HOME}/${GIT_REPO_AND_FOLDER}/configExample.json5" config.json5
  cd
fi

if ! sudo test -e "/root/.${CONFIG_FOLDER_NAME}"; then
  printf "\n${YELLOW}[Creating config data link for root.]${NC}\n"
  sudo ln -s "/home/${USER}/.${CONFIG_FOLDER_NAME}" /root
fi

if [[ -f ~/.bashrc ]]; then
  if ! (grep "${GIT_REPO_AND_FOLDER}" ~/.bashrc >/dev/null); then
    printf "\n${YELLOW}[Adding ${GIT_REPO_AND_FOLDER} Scripts folder to your path in .bashrc]${NC}\n"
    sh -c "echo \"export PATH=\\\$PATH:${HOME}/${GIT_REPO_AND_FOLDER}\" >> ~/.bashrc"
  fi
fi

if [[ -f ~/.zshrc ]]; then
  if ! (grep "${GIT_REPO_AND_FOLDER}" ~/.zshrc >/dev/null); then
    printf "\n${YELLOW}[Adding ${GIT_REPO_AND_FOLDER} Scripts folder to your path in .zshrc]${NC}\n"
    sh -c "echo \"export PATH=\\\$PATH:${HOME}/${GIT_REPO_AND_FOLDER}\" >> ~/.zshrc"
  fi
fi

printf "\n${LIGHT_PURPLE}[Updating PM2 and starting/restarting service.]${NC}\n"
# Unfortunately the program has to run as root to use the GPIO library that I'm using
sudo bash -ic "pm2 update;true"
"${HOME}"/${GIT_REPO_AND_FOLDER}/startService.sh

if [[ ${NEW_CONFIG} == "1" ]]; then
  printf "\n${LIGHT_PURPLE}NOTICE NOTICE NOTICE NOTICE${NC}\n"
  printf "\n${LIGHT_PURPLE}You MUST edit ${HOME}/.${CONFIG_FOLDER_NAME}/config.json5${NC}\n"
  printf "\n${LIGHT_PURPLE}It has been set up with example data that will not work for your Mechonoid.${NC}\n"
  printf "\n${RED}If this is the first time you ran this, please reboot now!${NC}\n"
fi
