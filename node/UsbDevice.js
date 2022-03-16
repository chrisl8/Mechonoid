/* eslint-disable no-param-reassign */
import { spawn } from 'child_process';
import esMain from 'es-main';
import getLinuxDeviceList from './getLinuxDeviceList.js';

async function getInfoFromDeviceList(rootFolder, deviceList) {
  // eslint-disable-next-line arrow-body-style
  const getSingleDeviceInfo = (device) => {
    return new Promise((resolve, reject) => {
      let outputData = '';
      const process = spawn('udevadm', [
        'info',
        '-n',
        `${rootFolder}${device}`,
      ]);
      process.stdout.on('data', (data) => {
        outputData += data;
      });
      process.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
      });
      process.on('close', (code) => {
        if (code === null || code === 0) {
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
  };
  const allResults = deviceList.map((device) =>
    getSingleDeviceInfo(device).then((deviceInfo) => deviceInfo),
  );
  return Promise.all(allResults);
}

class UsbDevice {
  constructor(uniqueDeviceString, stringLocation) {
    this.uniqueDeviceString = uniqueDeviceString;
    // stringLocation tells what line of the udevadm output the uniqueDeviceString is found in.
    // Usually 'product', 'name' or 'manufacturer '
    this.stringLocation = stringLocation;
  }

  async findDeviceName() {
    return new Promise(async (resolve, reject) => {
      const linuxUsbDeviceList = await getLinuxDeviceList('/dev/', [
        'USB',
        'ACM',
      ]);
      const linuxUsbDeviceListWithInfo = await getInfoFromDeviceList(
        '/dev/',
        linuxUsbDeviceList,
      );

      const deviceListWithInfo = linuxUsbDeviceListWithInfo;
      let foundDevice = false;
      let deviceName;
      for (let i = 0; i < deviceListWithInfo.length; i++) {
        for (let j = 0; j < deviceListWithInfo[i].deviceInfo.length; j++) {
          if (
            deviceListWithInfo[i].deviceInfo[j].includes(
              `${this.stringLocation}=`,
            )
          ) {
            const deviceStringLine =
              deviceListWithInfo[i].deviceInfo[j].split('=');
            if (deviceStringLine.length > 0) {
              const re = /"/g;
              deviceListWithInfo[i].deviceString = deviceStringLine[1].replace(
                re,
                '',
              );
            }
            break;
          }
        }
        if (deviceListWithInfo[i].hasOwnProperty('deviceString')) {
          if (
            deviceListWithInfo[i].deviceString.includes(this.uniqueDeviceString)
          ) {
            foundDevice = true;
            deviceName = deviceListWithInfo[i].devicePath;
            break;
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
}

export default UsbDevice;

if (esMain(import.meta)) {
  // Run the function if this is called directly instead of required.
  if (process.argv.length < 4) {
    console.log('You must provide a string to search for,');
    console.log(
      "and the line it is contained in, usually 'product', 'name' or 'manufacturer'.",
    );
    console.log('i.e.');
    console.log(
      'node UsbDevice.js "Numato Lab 1 Channel USB Powered Relay Module" product',
    );
    process.exit();
  }
  const usbDevice = new UsbDevice(process.argv[2], process.argv[3]);
  usbDevice
    .findDeviceName()
    .then((deviceName) => {
      console.log(`${deviceName}`);
    })
    .catch((error) => {
      console.log(`ERROR: ${error}`);
      process.exit(1);
    });
}
