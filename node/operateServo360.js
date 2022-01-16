import convertNumberRange from './convertNumberRange.js';
import {
  robotModel,
  hardwareFunctions,
  updateRobotModelData,
} from './robotModel.js';

const operateServo360 = ({ servoName, value, override = false }) => {
  console.log(servoName, value);
  // Prevent movement when already at full stop.
  const clearToMove = Boolean(
    value === 0 ||
      !robotModel.servos[servoName].switchClosed ||
      (value < 0 && !robotModel.servos[servoName].switchClosed.left) ||
      (value > 0 && !robotModel.servos[servoName].switchClosed.right) ||
      robotModel.servos[servoName].trulyContinuous,
  );

  if (
    clearToMove &&
    robotModel.servos[servoName] &&
    robotModel.hardware[robotModel.servos[servoName].hardwareController] &&
    robotModel.hardware[robotModel.motors[servoName].hardwareController]
      .online &&
    robotModel.hardware[robotModel.motors[servoName].hardwareController]
      .online === true
  ) {
    let target = robotModel.servos[servoName].off;
    // Servo input from web server for 360 servo is in -1000 to 1000 range, with 0 being off.
    if (value > 0) {
      target = convertNumberRange(
        value,
        0,
        1000,
        robotModel.servos[servoName].center,
        robotModel.servos[servoName].maximum,
      );
    } else if (value < 0) {
      target = convertNumberRange(
        value,
        -1000,
        0,
        robotModel.servos[servoName].minimum,
        robotModel.servos[servoName].center,
      );
    }
    updateRobotModelData(`servos.${servoName}.lastValue`, value);
    // eslint-disable-next-line no-underscore-dangle
    hardwareFunctions[
      robotModel.servos[servoName].hardwareController
    ].connection._sendCommand(
      0x84,
      robotModel.servos[servoName].channel,
      target,
    );
  }
};

export default operateServo360;
