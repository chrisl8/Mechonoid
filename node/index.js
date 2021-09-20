const PololuMaestro = require('pololu-maestro');
const pigpio = require('pigpio');
const Gpio = require('pigpio').Gpio;
const findUsbDevice = require('./findUsbDevice');
const RoboClaw = require('./RoboClaw');
const wait = require('./wait');
const webserver = require('./webserver');
const operateServo360 = require('./operateServo360');
const {
  robotModel,
  hardwareFunctions,
  updateRobotModelData,
} = require('./robotModel');
const cloudServerConnect = require('./cloudServerConnect');
const roboClawDataHandler = require('./roboClawDataHandler');

async function main() {
  // Get USB Device names for all hardware controllers
  for (const [key, value] of Object.entries(hardwareFunctions)) {
    if (value.type && (value.type === 'RoboClaw' || value.type === 'Maestro')) {
      // eslint-disable-next-line no-await-in-loop
      value.device = await findUsbDevice({ ...value });

      // Connect to Maestro Board
      if (value.type === 'Maestro' && value.device) {
        value.connection = new PololuMaestro(value.device, 115200, false);

        // wait until connection is ready
        value.connection.on('ready', () => {
          updateRobotModelData(`hardware.${key}`, true);
        });
      }
    }
  }

  // TODO: Poll Raspberry Pi throttle notice, and anything else that it can tell us, via some polling mechanism and display it on the web interface.

  // Connect to RoboClaw
  if (hardwareFunctions.roboClawDevice) {
    updateRobotModelData('hardware.roboClawReady', true);

    hardwareFunctions.roboClaw = new RoboClaw(hardwareFunctions.roboClawDevice);
    await wait(1000);
    hardwareFunctions.roboClaw.send({
      command: 'GETVERSION',
      callback: roboClawDataHandler,
    });
    hardwareFunctions.roboClaw.send({
      command: 'GETMBATT',
      callback: roboClawDataHandler,
    });

    // This is just for testing the Roboclaw
    /*
    hardwareFunctions.roboClaw.send({
      command: 'Test',
      callback: roboClawDataHandler,
    });

    hardwareFunctions.roboClaw.send({
      command: 'M1FORWARD',
      data: 64,
      callback: roboClawDataHandler,
    });
    for (let i = 0; i < 5; i++) {
      // eslint-disable-next-line no-await-in-loop
      await wait(1000);
      hardwareFunctions.roboClaw.send({
        command: 'GETM1SPEED',
        callback: roboClawDataHandler,
      });
      hardwareFunctions.roboClaw.send({
        command: 'GETM1ENC',
        callback: roboClawDataHandler,
      });
    }

    hardwareFunctions.roboClaw.send({
      command: 'M1FORWARD',
      data: 0,
      callback: roboClawDataHandler,
    });
    // for (let i = 0; i < 100; i++) {
    //   await wait(100);
    //   hardwareFunctions.roboClaw.send({
    //     command: 'GETM1SPEED',
    //     callback: roboClawDataHandler,
    //   });
    //   hardwareFunctions.roboClaw.send({
    //     command: 'GETM1ENC',
    //     callback: roboClawDataHandler,
    //   });
    // }

    // If set to 0 too soon, it happens before the motor has stopped moving,
    // and the result is not 0
    await wait(500);

    hardwareFunctions.roboClaw.send({
      command: 'SETM1ENCCOUNT',
      data: 0,
      callback: roboClawDataHandler,
    });

    hardwareFunctions.roboClaw.send({
      command: 'GETM1SPEED',
      callback: roboClawDataHandler,
    });
    hardwareFunctions.roboClaw.send({
      command: 'GETM1ENC',
      callback: roboClawDataHandler,
    });

    // hardwareFunctions.roboClaw.send({
    //   command: 'M1BACKWARD',
    //   data: 64,
    //   callback: roboClawDataHandler,
    // });
    // for (let i = 0; i < 60; i++) {
    //   await wait(100);
    //   hardwareFunctions.roboClaw.send({
    //     command: 'GETM1SPEED',
    //     callback: roboClawDataHandler,
    //   });
    //   hardwareFunctions.roboClaw.send({
    //     command: 'GETM1ENC',
    //     callback: roboClawDataHandler,
    //   });
    // }
    //
    // hardwareFunctions.roboClaw.send({
    //   command: 'M1BACKWARD',
    //   data: 0,
    //   callback: roboClawDataHandler,
    // });
    // for (let i = 0; i < 100; i++) {
    //   await wait(100);
    //   hardwareFunctions.roboClaw.send({
    //     command: 'GETM1SPEED',
    //     callback: roboClawDataHandler,
    //   });
    //   hardwareFunctions.roboClaw.send({
    //     command: 'GETM1ENC',
    //     callback: roboClawDataHandler,
    //   });
    // }

    // TODO: Needs to ensure motors, servos, lights are stopped on shutdown

    // let counter = 0;
    // // Test repeated commands
    // while (true) {
    //   counter++;
    //   if (counter < 5) {
    //     await wait(1);
    //     hardwareFunctions.roboClaw.send({ command: 'GETMBATT', data: counter });
    //   } else {
    //     counter = 0;
    //     await wait(1000);
    //     hardwareFunctions.roboClaw.send({ command: 'GETVERSION', data: counter });
    //   }
    // }
     */
  }

  /*
    Initializing pigio and then setting a SIGINT handler prevents the
    sigHandler: Unhandled signal 2, terminating
    error from showing up when shutting down the service via PM2
    Note that we can also run any needed shutdown/cleanup actions here
    if we like.
   */
  pigpio.initialize(); // pigpio C library initialized here

  process.on('SIGINT', async () => {
    console.log('Terminating...');
    if (robotModel.servos && robotModel.servos.length > 0) {
      operateServo360({ servoName: 'shoulders', value: 0 });
      operateServo360({ servoName: 'head', value: 0 });
    }
    await wait(1000);
    pigpio.terminate(); // pigpio C library terminated here
    process.exit(0);
  });

  const gpioGlitchFilterInput = 1000;

  function setRobotPartPosition({ location, entry, operations }) {
    if (
      operations.indexOf('rectifyCenterOffset') > -1 &&
      robotModel.servos[location].switchClosed[entry]
    ) {
      if (entry === 'left') {
        updateRobotModelData(`servos.${location}.centerOffset`, 'left');
      } else if (entry === 'right') {
        updateRobotModelData(`servos.${location}.centerOffset`, 'right');
      }
    }
    if (operations.indexOf('setCenterOffset') > -1) {
      if (!robotModel.servos[location].switchClosed[entry]) {
        if (robotModel.servos[location].lastValue > 0) {
          updateRobotModelData(`servos.${location}.centerOffset`, 'right');
        }
        if (robotModel.servos[location].lastValue < 0) {
          updateRobotModelData(`servos.${location}.centerOffset`, 'left');
        }
      }
    }
    if (operations.indexOf('setPositionInteger') > -1) {
      console.log('setPositionInteger:');
      console.log(location, entry, operations);
      console.log(robotModel.servos[location]);
    }
  }

  function handleGpioSwitch({ pin, location, entry, operations }) {
    // Monitor GPIO pins
    const switchPin = new Gpio(pin, {
      mode: Gpio.INPUT,
      pullUpDown: Gpio.PUD_UP,
      alert: true,
    });
    updateRobotModelData(
      `servos.${location}.switchClosed.${entry}`,
      Boolean(switchPin.digitalRead() === 0),
    );

    // Set initial center offset if available.
    setRobotPartPosition({ location, entry, operations });

    // Level must be stable for 10 ms before an alert event is emitted.
    switchPin.glitchFilter(gpioGlitchFilterInput);
    switchPin.on('alert', (level) => {
      const lastValue = robotModel.servos[location].lastValue; // We might need this later
      updateRobotModelData(
        `servos.${location}.switchClosed.${entry}`,
        Boolean(level === 0),
      );
      if (operations) {
        if (operations.indexOf('stopIfLessThanZero') > -1) {
          if (robotModel.servos[location].lastValue < 0) {
            operateServo360({ servoName: location, value: 0 });
          }
        }
        if (operations.indexOf('stopIfGreaterThanZero') > -1) {
          if (robotModel.servos.shoulders.lastValue > 0) {
            operateServo360({ servoName: location, value: 0 });
          }
        }
        setRobotPartPosition({ location, entry, operations });
      }
      if (
        robotModel.servos[location].switchClosed[entry] &&
        robotModel.servos[location].stopOnArrival === entry
      ) {
        operateServo360({ servoName: location, value: 0 });
        updateRobotModelData(`servos.${location}.stopOnArrival`, null);
      } else if (
        robotModel.servos[location].switchClosed[entry] &&
        robotModel.servos[location].stopOnArrival === 'center'
      ) {
        // We were asked to go to center, but reached someplace else, so reverse
        // TODO: This only works with 2 switches and one end point, not 4.
        //       Solution may be as simple as not using 'center' on the head.
        operateServo360({
          servoName: location,
          value: -lastValue,
        });
      }
      console.log(
        `${location} ${entry} Switch ${level === 0 ? 'Closed' : 'Open'}`,
      );
    });
  }

  if (robotModel.gpioPins && robotModel.gpioPins.length > 0) {
    robotModel.gpioPins.forEach((entry) => {
      handleGpioSwitch(entry);
    });
  }

  // Start web server
  await webserver.start();

  cloudServerConnect();
}

if (require.main === module) {
  (async () => {
    try {
      await main();
    } catch (e) {
      console.error('Robot failed with error:');
      console.error(e);
    }
  })();
}
