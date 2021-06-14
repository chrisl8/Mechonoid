const spawn = require('child_process').spawn;
const { updateRobotModelData } = require('./robotModel');

const shutDown = ({ reboot = false }) => {
  const shutdownArguments = [];
  if (reboot) {
    console.log(`System Reboot initiated.`);
    shutdownArguments.push('-r');
  } else {
    console.log(`System Shutdown initiated.`);
    shutdownArguments.push('-h');
  }
  shutdownArguments.push('now');
  updateRobotModelData('status', 'Offline');
  spawn('shutdown', shutdownArguments);
};

module.exports = shutDown;
