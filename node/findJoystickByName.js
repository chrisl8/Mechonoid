/* eslint-disable no-param-reassign */
import esMain from 'es-main';
import getLinuxDeviceList from './getLinuxDeviceList.js';
import joystickGetTaskOutputForDevice from './joystickGetTestOutputForDevice.js';

async function getInfoFromDeviceList(rootFolder, deviceList) {
  const allResults = deviceList.map((device) =>
    joystickGetTaskOutputForDevice({ device, rootFolder }).then(
      (deviceInfo) => deviceInfo,
    ),
  );
  return Promise.all(allResults);
}

async function FindJoystickByName(name) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    const linuxInputDeviceList = await getLinuxDeviceList('/dev/input/', [
      'js',
    ]);
    if (linuxInputDeviceList.length === 0) {
      reject(new Error('No joystick devices found'));
    }

    let linuxInputDeviceListWithInfo;
    try {
      linuxInputDeviceListWithInfo = await getInfoFromDeviceList(
        '/dev/input/',
        linuxInputDeviceList,
      );
    } catch (error) {
      reject(new Error(`Error getting device info.`));
    }

    const deviceListWithInfo = linuxInputDeviceListWithInfo;

    let foundDevice = false;
    let deviceName;
    if (deviceListWithInfo) {
      for (let i = 0; i < deviceListWithInfo.length; i++) {
        for (let j = 0; j < deviceListWithInfo[i].deviceInfo.length; j++) {
          if (
            deviceListWithInfo[i].deviceInfo[j].includes(`Joystick (${name})`)
          ) {
            // console.log(deviceListWithInfo[i].deviceInfo[j]);
            foundDevice = true;
            deviceName = deviceListWithInfo[i].devicePath;
            break;
          }
        }
      }
    }
    if (foundDevice) {
      resolve(deviceName);
    } else {
      reject(new Error('Not found.'));
    }
  });
}

export default FindJoystickByName;

if (esMain(import.meta)) {
  // Run the function if this is called directly instead of required.
  if (process.argv.length < 3) {
    console.log('You must provide a string to search for.\n');
    console.log(
      'This must be the text that appears between the parenthesis in the output of jstest, like so:\n',
    );
    console.log('Run jstest like this:');
    console.log('timeout 1 jstest /dev/input/js0 | grep Joystick\n');
    console.log('And if the output is like this:');
    console.log(
      'Joystick (Wireless Steam Controller) has 8 axes (X, Y, Rx, Ry, Hat0X, Hat0Y, Hat2X, Hat2Y)\n',
    );
    console.log('then you would run:');
    console.log('node FindJoystickByName "Wireless Steam Controller\n');
    process.exit();
  }
  try {
    const joystickDevicePath = await FindJoystickByName(process.argv[2]);
    console.log(joystickDevicePath);
  } catch (error) {
    console.log(error.message);
  }
}
