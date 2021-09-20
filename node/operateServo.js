const {
  robotModel,
  hardwareFunctions,
  updateRobotModelData,
} = require('./robotModel');

function convertNumberRange(oldValue, oldMin, oldMax, newMin, newMax) {
  return ((oldValue - oldMin) * (newMax - newMin)) / (oldMax - oldMin) + newMin;
}

const operateServo = ({ servoName, value }) => {
  // Prevent movement when already at full stop.
  const clearToMove = Boolean(
    value === 0 ||
      !robotModel.servos[servoName].switchClosed ||
      (value < 0 && !robotModel.servos[servoName].switchClosed.left) ||
      (value > 0 && !robotModel.servos[servoName].switchClosed.right),
  );

  if (
    clearToMove &&
    robotModel.servos[servoName] &&
    robotModel.hardware[robotModel.servos[servoName].hardwareController]
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

module.exports = operateServo;
