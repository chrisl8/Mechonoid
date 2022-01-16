import PololuMaestro from 'pololu-maestro';
import pigpio from 'pigpio';
import findUsbDevice from './findUsbDevice.js';
import RoboClaw from './RoboClaw.js';
import wait from './wait.js';
import webserver from './webserver.js';
import operateServo360 from './operateServo360.js';
import {
  robotModel,
  hardwareFunctions,
  updateRobotModelData,
} from './robotModel.js';
import cloudServerConnect from './cloudServerConnect.js';
import roboClawDataHandler from './roboClawDataHandler.js';
import roboClawPolling from './roboClawPolling.js';

const Gpio = pigpio.Gpio;

async function main() {
  // Get USB Device names for all hardware controllers
  for (const [key, value] of Object.entries(hardwareFunctions)) {
    updateRobotModelData(`hardware.${key}`, { online: false });
    if (value.type && (value.type === 'RoboClaw' || value.type === 'Maestro')) {
      // eslint-disable-next-line no-await-in-loop
      value.device = await findUsbDevice({ ...value });

      // Connect to Maestro Board
      if (value.type === 'Maestro' && value.device) {
        value.connection = new PololuMaestro(value.device, 115200, false);

        // wait until connection is ready
        value.connection.on('ready', () => {
          updateRobotModelData(`hardware.${key}.online`, true);
        });
      }

      // TODO: Poll Raspberry Pi throttle notice, and anything else that it can tell us, via some polling mechanism and display it on the web interface.
      // Get memory free and CPU usage and post a general "Pi Health" section.
      // Probably poll it every 5 minutes or so. Not very often.
      // can use top -b -n 1 and scrape
      // can use free to get free memory and divide.
      // % Memory In Use in bash:
      // https://stackoverflow.com/a/10586020/4982408
      // free | grep Mem | awk '{print $3/$2 * 100.0}'

      // CPU % used
      // https://stackoverflow.com/a/9229692/4982408
      // top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1"%"}'

      // Throttled (ever)
      // vcgencmd get_throttled
      // Should say:
      // throttled=0x0
      // https://www.raspberrypi.com/documentation/computers/os.html
      // Note, if it does NOT say that, then decoding it is more fun. :)

      // Pi Temp
      // https://www.raspberrypi.com/documentation/computers/os.html
      // vcgencmd measure_temp

      // Pi total memory
      // (Only do this once at startup)
      // vcgencmd get_config total_mem # in megabytes
      // https://www.raspberrypi.com/documentation/computers/os.html

      // PI model
      // cat /proc/device-tree/model

      // Connect to RoboClaw
      if (value.type === 'RoboClaw' && value.device) {
        // TODO:
        //      0. Do the controller settings that were saved in the Windows app need to be "loaded"?
        //      1. Set min/max voltage, current, and other safety parameters on Roboclaw at startup,
        //         or are they already "saved"?
        //      2. Read data such as battery voltage, temp, etc. via some polling mechanism, and make it available to web site, and display it on the site. Possibly respond to some issues?

        // TODO: The roboclow needs to be polled for data both to act on (low voltage, high amps) and to display (temperature?).
        //       If this is done, we don't probably even need a low voltage cutoff device, although some form of cutoff relay would be idea if this is done.

        // TODO: We could make some sort of poller that:
        //       0. Waits x milliseconds
        //       1. Checks to see when the last request was sent to the Roboclaw
        //             - So we need to record this on every command send.
        //       2. If it has been more than y milliseconds
        //             - Request key data from the roboclaw and update our objects

        // TODO: I'm not sure how the ROS loop of sending twist commands and getting odometry from the
        //       roboclaw will work, but it might not actually even matter, as a ROS node
        //       to use the roboclaw may be entirely unrelated to this code.
        //       Controlling the drive, from the web, of a ROS robot may be entirely different and
        //       unrelated to driving it via Node.js

        value.connection = new RoboClaw({ comPort: value.device, myName: key });
        // TODO: Is the wait required?
        // eslint-disable-next-line no-await-in-loop
        await wait(1000);
        // TODO: Save this somewhere for display?
        // TODO: If this comes back with a failed checksum, we need to try again?
        // TODO: Should this or the later PID info data update be the REAL "ready" indicator?
        value.connection.send({
          command: 'GETVERSION',
          callback: roboClawDataHandler,
        });

        value.connection.send({
          command: 'GETMBATT',
          callback: roboClawDataHandler,
        });
        // TODO: Get from config file.
        value.connection.send({
          command: 'SETMAINVOLTAGES',
          data: [11.7 * 10, 15 * 10],
        });
        value.connection.send({
          command: 'GETMINMAXMAINVOLTAGES',
          callback: roboClawDataHandler,
        });

        // TODO: Get from config file.
        // TODO: Was 4.5 before. Not sure if this resets on power cycle or not.
        value.connection.send({
          command: 'SETM1MAXCURRENT',
          data: [3 * 100, 0, 0, 0, 0],
        });
        value.connection.send({
          command: 'GETM1MAXCURRENT',
          callback: roboClawDataHandler,
        });

        // TODO: Get from config file.
        // TODO: Was 4.5 before. Not sure if this resets on power cycle or not.
        value.connection.send({
          command: 'SETM2MAXCURRENT',
          data: [3 * 100, 0, 0, 0, 0],
        });
        value.connection.send({
          command: 'GETM2MAXCURRENT',
          callback: roboClawDataHandler,
        });

        value.connection.send({
          command: 'GETENCODERMODE',
          callback: roboClawDataHandler,
        });
        value.connection.send({
          command: 'GETPINFUNCTIONS',
          callback: roboClawDataHandler,
        });

        // TODO: Save and use this in the "twist" or "diff" drive modes
        // TODO: If this comes back with a failed checksum, we need to try again!
        value.connection.send({
          command: 'READM1PID',
          callback: roboClawDataHandler,
        });
        value.connection.send({
          command: 'READM2PID',
          callback: roboClawDataHandler,
        });

        // TODO: Is it ready yet though?
        updateRobotModelData(`hardware.${key}.online`, true);

        roboClawPolling(value);
      }
    }
  }

  // TODO: Delete test code below.

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
    // if (operations.indexOf('setPositionInteger') > -1) {
    //   console.log('setPositionInteger:');
    //   console.log(location, entry, operations);
    //   console.log(robotModel.servos[location]);
    // }
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
  await webserver();

  cloudServerConnect();
}

try {
  await main();
} catch (e) {
  console.error('Robot failed with error:');
  console.error(e);
}
