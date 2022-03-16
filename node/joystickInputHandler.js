/* eslint-disable no-param-reassign */

import _ from 'lodash';
import Joystick from './joystick.js';
import convertNumberRange from './convertNumberRange.js';
import operateMotor from './operateMotor.js';
import operateServo from './operateServo.js';
import getLinuxDeviceList from './getLinuxDeviceList.js';
import wait from './wait.js';
import joystickGetName from './joystickGetName.js';

const joystickDevicePathRoot = '/dev/input/';
const activeJoystickControllers = {};

const inputHandler = (joystickDevice) => {
  const joystickController = activeJoystickControllers[joystickDevice];
  if (!joystickController.buttonStates) {
    joystickController.buttonStates = {};
  }

  const joystick = new Joystick({
    name: joystickController.name,
    deadZone: joystickController.deadZone,
    sensitivity: joystickController.sensitivity,
    devicePath: joystickController.devicePath,
  });

  joystick.on('button', (inputData) => {
    // console.log(inputData);

    // Save all button states for use elsewhere
    joystickController.buttonStates[inputData.number] = inputData.value;

    // Perform actions based on button numbers in the config file
    if (
      joystickController.buttonInputs &&
      joystickController.buttonInputs[inputData.number] &&
      joystickController.buttonInputs[inputData.number][inputData.value]
    ) {
      const thisInput =
        joystickController.buttonInputs[inputData.number][inputData.value];
      console.log(thisInput);
    }
  });

  joystick.on('axis', (inputData) => {
    if (
      joystickController.axisInputs &&
      joystickController.axisInputs[inputData.number]
    ) {
      const thisInput = joystickController.axisInputs[inputData.number];
      if (thisInput.outputType === 'twist') {
        let newValue = convertNumberRange(
          inputData.value,
          -thisInput.inputMax,
          thisInput.inputMax,
          -100,
          100,
        );
        // Avoid any of that -0 nonsense
        if (newValue !== 0) {
          // Must be reversed to align with twist input expectations
          newValue = -newValue;
        }
        newValue = Math.round(newValue);

        if (!joystickController.twistMessages) {
          joystickController.twistMessages = {};
        }

        if (!joystickController.twistMessages[thisInput.motorName]) {
          joystickController.twistMessages[thisInput.motorName] = {
            linearSpeed: 0,
            angularSpeed: 0,
          };
        }

        joystickController.twistMessages[thisInput.motorName][
          thisInput.angularOrLinearSpeed
        ] = newValue;

        // TODO: Some sort of timeout to shut off motors if the input doesn't change for too long.
        if (
          joystickController.twistMessages[thisInput.motorName].linearSpeed ===
            0 &&
          joystickController.twistMessages[thisInput.motorName].angularSpeed ===
            0
        ) {
          operateMotor({
            motorName: thisInput.motorName,
            value: 0,
          });
        } else {
          operateMotor({
            motorName: thisInput.motorName,
            twist: {
              linearSpeed:
                joystickController.twistMessages[thisInput.motorName]
                  .linearSpeed,
              angularSpeed:
                joystickController.twistMessages[thisInput.motorName]
                  .angularSpeed,
            },
          });
        }
      } else if (thisInput.outputType === 'servo') {
        if (
          thisInput.onlyActiveWhenButtonPressed === undefined ||
          thisInput.onlyActiveWhenButtonPressed === false ||
          joystickController.buttonStates[thisInput.onlyActiveWhenButtonPressed]
        ) {
          let newValue = convertNumberRange(
            inputData.value,
            -thisInput.inputMax,
            thisInput.inputMax,
            -1000,
            1000,
          );
          // Avoid any of that -0 nonsense
          if (newValue !== 0) {
            // Must be reversed to align with input expectations
            newValue = -newValue;
          }
          newValue = Math.round(newValue);
          if (newValue !== 0 || thisInput.allowZeroWhileActive) {
            // console.log(
            //   inputData.number,
            //   inputData.value,
            //   newValue,
            //   thisInput.allowZeroWhileActive,
            // );
            operateServo({
              servoName: thisInput.motorName,
              value: newValue,
            });
          }
        }
      }
    }
  });

  joystick.on('close', () => {
    console.log(`Joystick ${joystickController.name} closed`);
    delete activeJoystickControllers[joystickDevice];
  });

  joystick.publish();
};

const joystickInputHandler = async (joystickConfigurations) => {
  let rescanWait = 5; // seconds

  while (true) {
    // eslint-disable-next-line no-await-in-loop
    let joystickDeviceList;
    try {
      // eslint-disable-next-line no-await-in-loop
      joystickDeviceList = await getLinuxDeviceList(joystickDevicePathRoot, [
        'js',
      ]);
      // eslint-disable-next-line no-empty
    } catch {}

    if (joystickDeviceList && joystickDeviceList.length > 0) {
      for (const joystickDevice of joystickDeviceList) {
        if (
          !activeJoystickControllers[joystickDevice] ||
          activeJoystickControllers[joystickDevice].unknownDevice
        ) {
          // eslint-disable-next-line no-await-in-loop
          const joystickName = await joystickGetName({
            rootFolder: joystickDevicePathRoot,
            device: joystickDevice,
          });
          if (joystickName) {
            const matchingJoystickConfiguration = joystickConfigurations.find(
              (x) => x.name === joystickName,
            );
            if (matchingJoystickConfiguration) {
              console.log(
                `Joystick ${joystickName} found on ${joystickDevice}.`,
              );
              activeJoystickControllers[joystickDevice] = _.cloneDeep(
                matchingJoystickConfiguration,
              );
              activeJoystickControllers[
                joystickDevice
              ].devicePath = `${joystickDevicePathRoot}${joystickDevice}`;
              inputHandler(joystickDevice);
              rescanWait = 30; // Rescan less often when a working one exits.
            } else if (
              !activeJoystickControllers[joystickDevice] ||
              activeJoystickControllers[joystickDevice].name !== joystickName
            ) {
              console.log(
                `Joystick named "${joystickName}" found on ${joystickDevice}, but no joystick configuration found with this name.`,
              );
              activeJoystickControllers[joystickDevice] = {
                name: joystickName,
                unknownDevice: true,
              };
            }
          }
        }
      }
    } else {
      rescanWait = 10; // Try more often if we expect them and none are found.
    }

    // eslint-disable-next-line no-await-in-loop
    await wait(rescanWait * 1000);
  }
};

export default joystickInputHandler;
