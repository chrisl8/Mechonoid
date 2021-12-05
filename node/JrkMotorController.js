import { spawn, spawnSync } from 'child_process';

import wait from './wait.js';
import { hardwareFunctions } from './robotModel.js';

const jrk2cmd = 'jrk2cmd';

const coolDownPeriod = 100; // milliseconds

const parseLinesIntoObject = (input) => {
  const inputObject = {};
  if (input) {
    let inputArray = input.split('\n');

    // Filter empty lines out.
    inputArray = inputArray.filter((entry) => entry);

    inputArray.forEach((entry) => {
      const splitEntry = entry.split(':');
      const key = splitEntry[0];
      let value;
      if (splitEntry.length > 1) {
        value = splitEntry[1].trim();
      }

      // Strip any quotes from values.
      if (value) {
        value = value.replace(/'/g, '');
      }

      // Strip known units off of some entries.
      if (['Current', 'VIN voltage'].indexOf(key) > -1) {
        value = value.split(' ')[0];
      }

      // Convert some values to numbers.
      if (
        [
          'Up time',
          'Input',
          'Target',
          'Feedback',
          'Scaled feedback',
          'Error',
          'Integral',
          'Duty cycle target',
          'Duty cycle',
          'Current',
          'PID period count',
          'VIN voltage',
        ].indexOf(key) > -1
      ) {
        value = Number(value);
      }

      // TODO: If the batter is not plugged in you get these lines,
      //       which would be nice to deal with and/or track:
      /*
  'Errors currently stopping the motor': '',
  '  - Awaiting command': undefined,
  '  - No power': undefined,
       */

      inputObject[key] = value;
    });
  }
  return inputObject;
};

const listControllers = () => {
  const { stdout, stderr } = spawnSync(jrk2cmd, ['-l']);
  if (!stderr.toString() && stdout) {
    let inputArray = stdout.toString().split('\n');

    // Filter empty lines out.
    inputArray = inputArray.filter((entry) => entry);

    inputArray = inputArray.map((entry) => entry.split(',')[0]);

    return inputArray;
  }
  console.error(stderr.toString());
  return false;
};

class JrkMotorController {
  constructor(options) {
    // TODO: This is just example junk to help me get started.
    this.requestedSerialNumber =
      options && options.serialNumber ? options.serialNumber : null;
    this.maxTarget = options && options.maxTarget ? options.maxTarget : 4090; // True max of 4095 minus 5 to avoid "hanging" close to the end.
    this.minTarget = options && options.minTarget ? options.minTarget : 5; // True min of 0 plus 5 to avoid "hanging" close to the end.
    this.pollingInProgresss = false;
  }

  async initiate() {
    let serialNumber;

    // Get list of controllers.
    const controllerList = listControllers();

    // Ensure Controller(s) exist and respond.
    if (!controllerList || !controllerList.length) {
      console.error('ERROR: No Jrk Motor Controllers were found!');
      return false;
    }

    if (this.requestedSerialNumber) {
      // If a serial number is given, ensure it exists.
      if (controllerList.indexOf(this.requestedSerialNumber) === -1) {
        console.error(
          `ERROR: No Jrk Motor Controllers were found with serial number ${this.requestedSerialNumber}`,
        );
        return false;
      }
      // and use it
      serialNumber = this.requestedSerialNumber;
    } else {
      // If a serial number is NOT given, warn if more than one controller exists
      if (controllerList.length > 1) {
        console.error(
          'WARNING: Multiple Jrk Motor Controllers exist, but no serial number was provided. Setting first serial number by default.',
        );
      }
      // and set the first
      serialNumber = controllerList[0];
    }

    // Ensure no two controller objects are using the same serial number
    if (hardwareFunctions.jrkMotorControllerList.indexOf(serialNumber) > -1) {
      console.error(
        `ERROR: Controller serial number ${serialNumber} is already in use!`,
      );
      return false;
    }

    hardwareFunctions.jrkMotorControllerList.push(serialNumber);
    this.serialNumber = serialNumber;
    return serialNumber;
  }

  checkReady() {
    if (!this.serialNumber) {
      console.error(
        'ERROR: Controller is not initialized yet. Run and wait for .initiate() first!',
      );
      return false;
    }
    return true;
  }

  poll(callback, ...callbackArguments) {
    if (!this.checkReady()) {
      return false;
    }
    let dataString = '';
    if (!this.pollingInProgresss) {
      this.pollingInProgresss = true;

      this.process = spawn(jrk2cmd, ['-s', '-d', this.serialNumber]);

      this.process.stdout.on('data', (data) => {
        if (data) {
          dataString = `${dataString}${data}`;
        }
      });

      this.process.stderr.on('data', (data) => {
        console.error(data);
      });

      this.process.on('error', (err) => {
        console.error(err);
      });

      this.process.on('close', async (code) => {
        if (code !== 0) {
          console.error(code);
        }
        if (dataString) {
          const responseObject = parseLinesIntoObject(dataString);
          if (callback) {
            callback(responseObject, ...callbackArguments);
          } else {
            console.log(responseObject);
          }
        }
        await wait(coolDownPeriod);
        this.pollingInProgresss = false;
      });
    } else {
      return false;
    }
    return true; // Indicate that a poll  was run.
  }

  setTarget(target) {
    if (!this.checkReady()) {
      return false;
    }
    if (target > this.maxTarget) {
      console.error(
        `Target ${target} is greater than max target of ${this.maxTarget}!`,
      );
      return false;
    }
    if (target < this.minTarget) {
      console.error(
        `Target ${target} is less than min target of ${this.minTarget}!`,
      );
      return false;
    }

    let dataString = '';

    // Since this is literally run on the command line,
    // instead of data sent over a serial port,
    // there is no check to ensure two commands are not set at the same time.
    // Unlike polling, where if one is running, that is good enough anyway.

    this.process = spawn(jrk2cmd, [
      '--target',
      target,
      '-d',
      this.serialNumber,
    ]);

    this.process.stdout.on('data', (data) => {
      if (data) {
        dataString = `${dataString}${data}`;
      }
    });

    this.process.stderr.on('data', (data) => {
      console.error(data);
    });

    this.process.on('error', (err) => {
      console.error(err);
    });

    this.process.on('close', async (code) => {
      if (code !== 0) {
        console.error(code);
      }
      if (dataString) {
        console.log(dataString);
      }
    });
    return true; // Indicate that a poll  was run.
  }
}

export default JrkMotorController;
