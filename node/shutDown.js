import { spawn } from 'child_process';
import { updateRobotModelData } from './robotModel.js';

const shutDown = ({ reboot = false }) => {
  const shutdownArguments = ['shutdown'];
  if (reboot) {
    console.log(`System Reboot initiated.`);
    shutdownArguments.push('-r');
  } else {
    console.log(`System Shutdown initiated.`);
    shutdownArguments.push('-h');
  }
  shutdownArguments.push('now');
  updateRobotModelData('status', 'Offline');
  spawn('sudo', shutdownArguments);
};

export default shutDown;
