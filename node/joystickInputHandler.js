/* eslint-disable no-param-reassign */

import _ from 'lodash';
import Joystick from './joystick.js';
import convertNumberRange from './convertNumberRange.js';
import operateMotor from './operateMotor.js';
import operateServo from './operateServo.js';
import getLinuxDeviceList from './getLinuxDeviceList.js';
import wait from './wait.js';
import joystickGetName from './joystickGetName.js';
import operateServo360 from './operateServo360.js';
import runShellScript from './runShellScript.js';

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

    if (
      joystickController.buttonInputs &&
      joystickController.buttonInputs.length > 0
    ) {
      joystickController.buttonInputs.forEach((buttonInput) => {
        if (
          buttonInput.number === inputData.number &&
          buttonInput.value === inputData.value
        ) {
          if (buttonInput.function === 'callShellScript') {
            runShellScript(buttonInput.script, buttonInput.arguments);
          } else if (buttonInput.function === 'operateMotor') {
            operateMotor({
              motorName: buttonInput.motorName,
              value: buttonInput.motorValue,
            });
            // } else {
            //   console.log(inputData);
            // For testing.
          }
        }
      });
    }
  });

  joystick.on('axis', (inputData) => {
    if (
      joystickController.axisInputs &&
      joystickController.axisInputs.length > 0
    ) {
      joystickController.axisInputs.forEach((axisInput) => {
        if (
          axisInput.number === inputData.number &&
          (joystickController.buttonStates[
            axisInput.onlyActiveWhenButtonPressed
          ] ||
            axisInput.onlyActiveWhenButtonPressed === undefined ||
            axisInput.onlyActiveWhenButtonPressed === false)
        ) {
          if (axisInput.outputType === 'twist') {
            let newValue = convertNumberRange(
              inputData.value,
              -axisInput.inputMax,
              axisInput.inputMax,
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

            if (!joystickController.twistMessages[axisInput.motorName]) {
              joystickController.twistMessages[axisInput.motorName] = {
                linearSpeed: 0,
                angularSpeed: 0,
              };
            }

            joystickController.twistMessages[axisInput.motorName][
              axisInput.angularOrLinearSpeed
            ] = newValue;

            // TODO: Some sort of timeout to shut off motors if the input doesn't change for too long.
            if (
              joystickController.twistMessages[axisInput.motorName]
                .linearSpeed === 0 &&
              joystickController.twistMessages[axisInput.motorName]
                .angularSpeed === 0
            ) {
              operateMotor({
                motorName: axisInput.motorName,
                value: 0,
              });
            } else {
              operateMotor({
                motorName: axisInput.motorName,
                twist: {
                  linearSpeed:
                    joystickController.twistMessages[axisInput.motorName]
                      .linearSpeed,
                  angularSpeed:
                    joystickController.twistMessages[axisInput.motorName]
                      .angularSpeed,
                },
              });
            }
          } else if (axisInput.outputType === 'servo') {
            let newValue = convertNumberRange(
              inputData.value,
              -axisInput.inputMax,
              axisInput.inputMax,
              -1000,
              1000,
            );
            // Avoid any of that -0 nonsense
            if (newValue !== 0) {
              // Must be reversed to align with input expectations
              newValue = -newValue;
            }
            newValue = Math.round(newValue);
            if (newValue !== 0 || axisInput.allowZeroWhileActive) {
              // console.log(
              //   inputData.number,
              //   inputData.value,
              //   newValue,
              //   axisInput.allowZeroWhileActive,
              // );
              console.log(inputData.value, newValue);
              operateServo({
                servoName: axisInput.motorName,
                value: newValue,
              });
            }
          } else if (axisInput.outputType === 'servo360') {
            let newValue = convertNumberRange(
              inputData.value,
              -axisInput.inputMax,
              axisInput.inputMax,
              -1000,
              1000,
            );
            if (axisInput.reversed && newValue !== 0) {
              newValue = -newValue;
            }
            newValue = Math.round(newValue);
            operateServo360({
              servoName: axisInput.motorName,
              value: newValue,
            });
          } else if (axisInput.outputType === 'pseudoButton') {
            if (
              inputData.value === axisInput.trueIfExactly ||
              inputData.value > axisInput.trueIfGreaterThan ||
              inputData.value < axisInput.trueIfLessThan
            ) {
              joystickController.buttonStates[
                axisInput.pseudoButtonNumber
                  ? axisInput.pseudoButtonNumber
                  : inputData.number
              ] = true;
            } else if (
              inputData.value === axisInput.falseIfExactly ||
              inputData.value > axisInput.falseIfGreaterThan ||
              inputData.value < axisInput.falseIfLessThan
            ) {
              joystickController.buttonStates[
                axisInput.pseudoButtonNumber
                  ? axisInput.pseudoButtonNumber
                  : inputData.number
              ] = false;
            }
          }
        }
      });
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
