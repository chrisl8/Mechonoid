#!/usr/bin/env bash
# shellcheck disable=SC2059 disable=SC2129
# Run this on you Raspberry Pi to make everything work!

GIT_REPO_AND_FOLDER=RobotAnything

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
#PURPLE='\033[0;35m'
YELLOW='\033[1;33m'
#LIGHTCYAN='\033[1;36m'
#LIGHTBLUE='\033[1;34m'
LIGHT_PURPLE='\033[1;35m'
NC='\033[0m' # NoColor

printf "\n${YELLOW}[Updating & upgrading all existing Ubuntu packages]${NC}\n"
sudo apt update
sudo apt upgrade -y

PACKAGE_TO_INSTALL_LIST=()
PACKAGE_TO_INSTALL_LIST+=(git)
#git - It is unlikely that you got this far without git, but just in case.
PACKAGE_TO_INSTALL_LIST+=(wget)
#wget is required to install Node Version Manager (nvm)
PACKAGE_TO_INSTALL_LIST+=(rpi.gpio-common)
#rpi.gpio-common - Required to use the GPIO pins in Ubuntu
PACKAGE_TO_INSTALL_LIST+=(unzip)
#unzip is required to extract downloaded packages for installation
PACKAGE_TO_INSTALL_LIST+=(build-essential)
#build-essential includes things like make and libraries required to build the GPIO tools
PACKAGE_TO_INSTALL_LIST+=(libraspberrypi-bin)
#libraspberrypi-bin provides extra commands for working with the Raspberry Pi specifically.

printf "\n${YELLOW}[Installing additional Ubuntu and ROS Packages for RobotAnything]${NC}\n"
printf "${BLUE}This runs every time, in case new packages were added.${NC}\n"
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

printf "${BLUE}${GIT_REPO_AND_FOLDER} repository${NC}\n"
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

printf "${BLUE}[Installing/Updating Node Version Manager]${NC}\n"
if [[ -e ${HOME}/.nvm/nvm.sh ]]; then
  printf "${BLUE}Deactivating existing Node Version Manager:${NC}\n"
  export NVM_DIR="${HOME}/.nvm"
  # shellcheck source=/home/chrisl8/.nvm/nvm.sh
  [[ -s "$NVM_DIR/nvm.sh" ]] && . "$NVM_DIR/nvm.sh" # This loads nvm
  nvm deactivate
fi

# The entire thing must run as root in order to access the GPIO pins,
# so setting up root to do this
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | sudo bash
sudo bash -ic "nvm install --lts;true"
sudo bash -ic "npm install pm2@latest -g;true"

# We will do as much setup and such as we can locally though.
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
export NVM_DIR="${HOME}/.nvm"
# shellcheck source=/home/chrisl8/.nvm/nvm.sh
[[ -s "$NVM_DIR/nvm.sh" ]] && . "$NVM_DIR/nvm.sh" # This loads nvm

export NVM_SYMLINK_CURRENT=true
if ! (grep NVM_SYMLINK_CURRENT ~/.bashrc >/dev/null); then
  printf "\n${YELLOW}[Setting the NVM current environment in your .bashrc file]${NC}\n"
  sh -c "echo \"export NVM_SYMLINK_CURRENT=true\" >> ~/.bashrc"
fi
nvm install --lts
nvm alias default "lts/*"

cd "${HOME}/${GIT_REPO_AND_FOLDER}/node"
printf "\n${YELLOW}[Grabbing node dependencies for Node.js scripts]${NC}\n"
printf "${BLUE}You may get some errors here, that is normal. As long as things work, it is OK.$NC\n"
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

if ! [[ -d ${HOME}/.robotAnything ]]; then
  printf "\n${YELLOW}[Creating config folder.]${NC}\n"
  cd
  mkdir .robotAnything
fi

NEW_CONFIG=0

if ! [[ -f ${HOME}/.robotAnything/config.json ]]; then
  NEW_CONFIG=1
  printf "\n${YELLOW}[Creating example config data.]${NC}\n"
  cd "${HOME}/.robotAnything"
  cp "${HOME}/${GIT_REPO_AND_FOLDER}/configExample.json" config.json
  cd
fi

if ! sudo test -e "/root/.robotAnything"; then
  printf "\n${YELLOW}[Creating config data link for root.]${NC}\n"
  sudo ln -s /home/ubuntu/.robotAnything /root
fi

if [[ -f ~/.bashrc ]]; then
  if ! (grep "${GIT_REPO_AND_FOLDER}" ~/.bashrc >/dev/null); then
    printf "\n${YELLOW}[Adding RobotAnything Scripts folder to your path in .bashrc]${NC}\n"
    sh -c "echo \"export PATH=\\\$PATH:${HOME}/${GIT_REPO_AND_FOLDER}\" >> ~/.bashrc"
  fi
fi

if [[ -f ~/.zshrc ]]; then
  if ! (grep "${GIT_REPO_AND_FOLDER}" ~/.zshrc >/dev/null); then
    printf "\n${YELLOW}[Adding RobotAnything Scripts folder to your path in .zshrc]${NC}\n"
    sh -c "echo \"export PATH=\\\$PATH:${HOME}/${GIT_REPO_AND_FOLDER}\" >> ~/.zshrc"
  fi
fi

printf "\n${LIGHT_PURPLE}[Updating PM2 and starting/restarting service.]${NC}\n"
# Unfortunately the program has to run as root to use the GPIO library that I'm using
sudo bash -ic "pm2 update;true"
"${HOME}"/${GIT_REPO_AND_FOLDER}/startService.sh

if [[ ${NEW_CONFIG} == "1" ]]; then
  printf "\n${LIGHT_PURPLE}NOTICE NOTICE NOTICE NOTICE${NC}\n"
  printf "\n${LIGHT_PURPLE}You MUST edit ${HOME}/.robotAnything/config.json${NC}\n"
  printf "\n${LIGHT_PURPLE}It has been set up with example data that will not work for your robot.${NC}\n"
fi
