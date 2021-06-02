const convertNumberRange = require('./convertNumberRange');
const roboClawDataHandler = require('./roboClawDataHandler');
const { robotModel, hardwareFunctions } = require('./robotModel');

const operateMotorSpeed = ({ motorName, value }) => {
  if (
    robotModel.motors &&
    robotModel.motors[motorName] &&
    hardwareFunctions.roboClawReady
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
    // TODO: This assumes "dual" === true, but it should not.
    let command = 'MIXEDFORWARD';
    if (value > 0) {
      data = convertNumberRange(
        value,
        0,
        1000,
        robotModel.motors[motorName].off,
        robotModel.motors[motorName].maximum,
      );
    } else if (value < 0) {
      command = 'MIXEDBACKWARD';
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

    robotModel.motors[motorName].lastValue = value;

    console.log(motorName, value, command, data);

    // Mixed Mode will not work until it has a valid "turn" entry as well as drive entry.
    // So just send a "MIXEDRIGHT" 0 to make it happey.
    // TODO: This might be better sent at initialization time?
    hardwareFunctions.roboClaw.send({
      command: 'MIXEDRIGHT',
      data: 0,
      callback: roboClawDataHandler,
    });

    hardwareFunctions.roboClaw.send({
      command,
      data,
      callback: roboClawDataHandler,
    });
  }
};

module.exports = operateMotorSpeed;
