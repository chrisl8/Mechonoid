import convertNumberRange from './convertNumberRange.js';
import {
  robotModel,
  hardwareFunctions,
  updateRobotModelData,
} from './robotModel.js';
import roboClawDataHandler from './roboClawDataHandler.js';
import wait from './wait.js';

// NOTE: These are notes. The settins are in the config file.
// const baseWidth = 0.66; // in Meters
// https://www.pololu.com/product/2828
// This gearmotor is a powerful 12V brushed DC motor with a 150:1 metal gearbox and an integrated quadrature encoder that provides a resolution of 64 counts per revolution of the motor shaft, which corresponds to 9600 counts per revolution of the gearbox’s output shaft.
// const countsPerRevolution = 9600;
// https://www.pololu.com/product/3283
// This black polyurethane scooter/skate wheel measures 200 mm (7.9″) in diameter and 30 mm (1.2″) in width
// const wheelRadius = 200 / 2 / 1000; // in Meters

function convertTwistToMotorSpeeds({ motorName, twist }) {
  // Copied from:
  // void diffdrive_roscore::twist_callback(const geometry_msgs::Twist &msg)
  // in:
  // https://github.com/nobleo/roboclaw/blob/master/src/diffdrive_roscore.cpp

  const stepsPerMeter =
    robotModel.motors[motorName].countsPerRevolution /
    (2 * robotModel.motors[motorName].wheelRadius * Math.PI);

  const motorVel = {
    mot1_vel_sps: 0,
    mot2_vel_sps: 0,
  };

  // eslint-disable-next-line no-param-reassign
  twist.linearSpeed = convertNumberRange(
    twist.linearSpeed,
    -100,
    100,
    -robotModel.motors[motorName].maxLinearSpeed,
    robotModel.motors[motorName].maxLinearSpeed,
  );

  // eslint-disable-next-line no-param-reassign
  twist.angularSpeed = convertNumberRange(
    twist.angularSpeed,
    -100,
    100,
    -robotModel.motors[motorName].maxAngularSpeed,
    robotModel.motors[motorName].maxAngularSpeed,
  );

  // Linear
  motorVel.mot1_vel_sps += stepsPerMeter * twist.linearSpeed;
  motorVel.mot2_vel_sps += stepsPerMeter * twist.linearSpeed;

  // Angular
  motorVel.mot1_vel_sps += -(
    (stepsPerMeter *
      twist.angularSpeed *
      robotModel.motors[motorName].baseWidth) /
    2
  );
  motorVel.mot2_vel_sps +=
    (stepsPerMeter *
      twist.angularSpeed *
      robotModel.motors[motorName].baseWidth) /
    2;

  // Integers only please
  motorVel.mot1_vel_sps = Math.trunc(motorVel.mot1_vel_sps);
  motorVel.mot2_vel_sps = Math.trunc(motorVel.mot2_vel_sps);

  return [motorVel.mot1_vel_sps, motorVel.mot2_vel_sps];
}

// TODO: Update this to also work for:
//       - One motor at a time.
//         - In theory using M1/2FORWARD/BACKWARD instead of ...MIXED
//       - Only forward/back of both motors together.
//         - Does Roboclaw regulate this to ensure they are in step?
//       - Steering with both motors in a differential drive setup.
//         - Copy in ArloBot/website/src/containers/RemoteConrol.js to the web site and adapt it for to control this.
//          - Currently it uses twist commands, so that will either need to change, or build code to interpret those? (which could be handy in ROS2?)
//       NOTE: Motors operated on a POSITION basis would, in theory, use a different module?

let lastMotorName;
let lastValue;
let lastTwist;

const operateMotor = async ({ motorName, value, twist }) => {
  if (
    motorName !== lastMotorName ||
    value !== lastValue ||
    twist !== lastTwist
  ) {
    lastMotorName = motorName;
    lastValue = value;
    lastTwist = twist;
    if (typeof twist === 'object' && twist !== null) {
      // TODO: Convert incoming max/min speeds to those of the actual motor.
      // TODO: Get the max speed. I think I set it in the Roboclaw already?
      const motorVel = convertTwistToMotorSpeeds({ motorName, twist });
      if (robotModel.motors[motorName].reversed) {
        motorVel.reverse();
      }
      if (robotModel.motors[motorName].mountedBackwards) {
        motorVel[0] = -motorVel[0];
        motorVel[1] = -motorVel[1];
      }
      hardwareFunctions[
        robotModel.motors[motorName].hardwareController
      ].connection.send({
        command: 'MIXEDSPEED',
        data: motorVel,
      });
    } else if (value === 0 || value) {
      if (
        robotModel.motors &&
        robotModel.motors[motorName] &&
        robotModel.hardware[robotModel.motors[motorName].hardwareController] &&
        robotModel.hardware[robotModel.motors[motorName].hardwareController]
          .online &&
        robotModel.hardware[robotModel.motors[motorName].hardwareController]
          .online === true
      ) {
        /*
          8 - Drive Forward
            Drive forward in mix mode. Valid data range is 0 - 127. A value of 0 = full stop and 127 = full forward.
            Send: [Address, 8, Value, CRC(2 bytes)]
            Receive: [0xFF]
          9 - Drive Backwards
            Drive backwards in mix mode. Valid data range is 0 - 127. A value of 0 = full stop and 127 = full reverse.
            Send: [Address, 9, Value, CRC(2 bytes)]
            Receive: [0xFF]
         */
        let data = robotModel.motors[motorName].off;
        // TODO: Check type and channel to determine what command to use.
        let commandPrefix = 'MIXED';

        if (robotModel.motors[motorName].channel !== 'dual') {
          commandPrefix = `M${robotModel.motors[motorName].channel}`;
        }

        let commandSuffix = robotModel.motors[motorName].mountedBackwards
          ? 'BACKWARD'
          : 'FORWARD';
        if (value > 0) {
          data = convertNumberRange(
            value,
            0,
            1000,
            robotModel.motors[motorName].off,
            robotModel.motors[motorName].maximum,
          );
        } else if (value < 0) {
          commandSuffix = commandSuffix === 'BACKWARD' ? 'FORWARD' : 'BACKWARD';
          data = convertNumberRange(
            value,
            -1000,
            0,
            robotModel.motors[motorName].minimum,
            robotModel.motors[motorName].off,
          );
        }

        // Integers only please
        data = Math.trunc(data);

        // Motors only accept positive values. "negative" is accounted for in the command ("reverse" vs. "forward")
        data = Math.abs(data);

        // TODO: Ensure this is resulting in sufficient granularity (minimum speed) and that max is the true max sustainable speed of the motor(s) by testing feedback on motor's speed after sending the command.

        // TODO: Should we use the lastValue to avoid repeating the same command over and over
        //       to the roboClaw? Otherwise we can saturate the link, right? Not to mention
        //       serial data sends take CPU time.
        //       Test it before changing it, in case there is some possibility of the Roboclaw
        //       being flaky.
        updateRobotModelData(`motors.${motorName}.lastValue`, value);

        const command = `${commandPrefix}${commandSuffix}`;

        // Mixed Mode will not work until it has a valid "turn" entry as well as drive entry.
        // So just send a "MIXEDRIGHT" 0 to make it happy.
        // TODO: This might be better sent at initialization time?
        // TODO: Should we mark if/when this is set, and not send it repeatedly?
        // TODO: It is ENTIRELY POSSIBLE to have multiple "types" for the SAME motors and controller,
        //       so if we send this and then assume it WAS sent, we MUST use a flag on the hardwareController
        //       itself to indicate that it was sent. Then we can check it from any motor instance for the
        //       same controller.
        if (commandPrefix === 'MIXED') {
          hardwareFunctions[
            robotModel.motors[motorName].hardwareController
          ].connection.send({
            command: 'MIXEDRIGHT',
            data: 0,
          });
        }

        hardwareFunctions[
          robotModel.motors[motorName].hardwareController
        ].connection.send({
          command,
          data,
        });
        // Update currents
        await wait(10);
        hardwareFunctions[
          robotModel.motors[motorName].hardwareController
        ].connection.send({
          command: 'GETCURRENTS',
          callback: roboClawDataHandler,
        });
      }
    }
  }
};

export default operateMotor;
