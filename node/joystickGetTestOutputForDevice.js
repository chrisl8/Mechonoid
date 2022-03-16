import { spawn } from 'child_process';

const joystickGetTaskOutputForDevice = ({ device, rootFolder }) =>
  new Promise((resolve, reject) => {
    let outputData = '';
    // timeout 1 jstest /dev/input/js0 | grep Joystick
    const process = spawn('timeout', ['1', 'jstest', `${rootFolder}${device}`]);
    process.stdout.on('data', (data) => {
      outputData += data;
    });
    process.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });
    process.on('close', (code) => {
      if (code === null || code === 0 || code === 124) {
        const outputAsArray = String(outputData).split('\n');
        resolve({
          device,
          devicePath: `${rootFolder}${device}`,
          deviceInfo: outputAsArray,
        });
      } else {
        reject(code);
      }
    });
  });

export default joystickGetTaskOutputForDevice;
