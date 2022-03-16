import joystickGetTestOutputForDevice from './joystickGetTestOutputForDevice.js';

const joystickNameRegex = /^Joystick \((.+?)\)/gm;

const joystickGetName = async ({ device, rootFolder }) => {
  const joystickTestOutput = await joystickGetTestOutputForDevice({
    device,
    rootFolder,
  });
  let joystickName;
  if (
    joystickTestOutput &&
    joystickTestOutput.deviceInfo &&
    joystickTestOutput.deviceInfo.length > 0
  ) {
    joystickTestOutput.deviceInfo.forEach((line) => {
      const joystickNameMatch = joystickNameRegex.exec(line);
      if (joystickNameMatch) {
        joystickName = joystickNameMatch[1];
      }
    });
  }
  return joystickName;
};

export default joystickGetName;
