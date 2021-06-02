const spawn = require('child_process').spawn;

const shutDown = ({ reboot = false }) => {
  spawn('shutdown', [`${reboot ? '-r' : '-h'}`, 'now']);
};

module.exports = shutDown;
