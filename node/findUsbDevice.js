import UsbDevice from './UsbDevice.js';

const findUsbDevice = async ({
  logName,
  uniqueDeviceString,
  stringLocation,
  squelchLogging,
}) => {
  if (!squelchLogging) {
    console.log(`Finding ${logName || uniqueDeviceString}...`);
  }
  const usbDevice = new UsbDevice(uniqueDeviceString, stringLocation);
  let usbDeviceName;
  try {
    usbDeviceName = await usbDevice.findDeviceName();
  } catch (e) {
    if (!squelchLogging) {
      console.error(`Failed to find ${logName || uniqueDeviceString}.`);
    }
  }
  return usbDeviceName;
};

export default findUsbDevice;
