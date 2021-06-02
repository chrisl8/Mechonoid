const PololuMaestro = require('pololu-maestro');
const pigpio = require('pigpio');
const Gpio = require('pigpio').Gpio;
const UsbDevice = require('./UsbDevice');
const RoboClaw = require('./RoboClaw');
const wait = require('./wait');
const webserver = require('./webserver');
const operateServo360 = require('./operateServo360');
const { robotModel, hardwareFunctions } = require('./robotModel');
const cloudServerConnect = require('./cloudServerConnect');
const roboClawDataHandler = require('./roboClawDataHandler');

const findUsbDevice = async ({
  logName,
  uniqueDeviceString,
  stringLocation,
}) => {
  console.log(`Finding ${logName}...`);
  const usbDevice = new UsbDevice(uniqueDeviceString, stringLocation);
  let usbDeviceName;
  try {
    usbDeviceName = await usbDevice.findDeviceName();
  } catch (e) {
    console.error(`Failed to find ${logName}.`);
  }
  return usbDeviceName;
};

async function main() {
  // Get USB Device names
  hardwareFunctions.maestroBoard = await findUsbDevice({
    logName: 'Maestro Board',
    uniqueDeviceString: 'Pololu_Mini_Maestro_18-Channel_USB_Servo_Controller',
    stringLocation: 'ID_MODEL',
  });
  hardwareFunctions.roboClawDevice = await findUsbDevice({
    logName: 'RoboClaw',
    stringLocation: 'ID_MODEL',
    uniqueDeviceString: 'USB_Roboclaw_2x15A',
  });

  // Connect to Maestro Board
  if (hardwareFunctions.maestroBoard) {
    hardwareFunctions.maestro = new PololuMaestro(
      hardwareFunctions.maestroBoard,
      115200,
      false,
    );
    //
    // wait until connection is ready
    hardwareFunctions.maestro.on('ready', () => {
      hardwareFunctions.maestroReady = true;
      robotModel.hardware.maestroReady = true;
    });
  }

  // Connect to RoboClaw
  if (hardwareFunctions.roboClawDevice) {
    hardwareFunctions.roboClawReady = true;
    robotModel.hardware.roboClawReady = true;

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
        robotModel.servos[location].centerOffset = 'left';
      } else if (entry === 'right') {
        robotModel.servos[location].centerOffset = 'right';
      }
    }
    if (operations.indexOf('setCenterOffset') > -1) {
      if (!robotModel.servos[location].switchClosed[entry]) {
        if (robotModel.servos[location].lastValue > 0) {
          robotModel.servos[location].centerOffset = 'right';
        }
        if (robotModel.servos[location].lastValue < 0) {
          robotModel.servos[location].centerOffset = 'left';
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
    robotModel.servos[location].switchClosed[entry] = Boolean(
      switchPin.digitalRead() === 0,
    );

    // Set initial center offset if available.
    setRobotPartPosition({ location, entry, operations });

    // Level must be stable for 10 ms before an alert event is emitted.
    switchPin.glitchFilter(gpioGlitchFilterInput);
    switchPin.on('alert', (level) => {
      const lastValue = robotModel.servos[location].lastValue; // We might need this later
      robotModel.servos[location].switchClosed[entry] = Boolean(level === 0);
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
        robotModel.servos[location].stopOnArrival = null;
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
