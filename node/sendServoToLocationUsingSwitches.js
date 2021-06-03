const operateServo360 = require('./operateServo360');
const { robotModel, updateRobotModelData } = require('./robotModel');

function sendServoToLocationUsingSwitches(data) {
  console.log(data);
  const selfMoveToCenterSpeed = 160; // Tweaked to get it to fall on center without going past.
  // Hitting the side requires less precision. Might as well go faster, especially if we might have a long ways to go!
  const selfMoveSpeed = 250;
  console.log(robotModel.servos[data.target]);

  // Make code easier to read by setting easy to read variables.
  const dataIsValid = data && data.target && (data.value === 0 || data.value);
  const alreadyAtDestination =
    robotModel.servos[data.target].switchClosed[data.value];
  const destination = data.value;

  if (dataIsValid && !alreadyAtDestination) {
    updateRobotModelData(`servos.${data.target}.stopOnArrival`, destination);

    if (destination === 'center') {
      if (
        robotModel.servos[data.target].switchClosed.left ||
        (robotModel.servos[data.target].centerOffset === 'left' &&
          !robotModel.servos[data.target].switchClosed.right)
      ) {
        // We are either 'left' of center or AT the left switch, so move right.
        // Note this is also skipped if we THINK we are 'left' of center,
        // but the right switch is actually closed, which happens sometimes.
        operateServo360({
          servoName: data.target,
          value: selfMoveToCenterSpeed,
        });
      } else {
        // We already established that the destination is 'center',
        // and that we are not currently AT 'center'
        // SINCE we aren't known to be 'left' of center,
        // and we are not AT the left switch,
        // EITHER we are already right of center,
        // OR we are AT the right edge,
        // OR we have no idea where we are.
        // In which case, moving 'left' is either valid, required,
        // or as good as any other option.
        operateServo360({
          servoName: data.target,
          value: -selfMoveToCenterSpeed,
        });
      }
    } else if (destination === 'right') {
      operateServo360({ servoName: data.target, value: selfMoveSpeed });
    } else if (destination === 'left') {
      operateServo360({ servoName: data.target, value: -selfMoveSpeed });
    } else if (destination === 'front') {
      // TODO: Intelligently move the correct direction based on known position if it is known.
      operateServo360({ servoName: data.target, value: selfMoveSpeed });
    } else if (destination === 'back') {
      // TODO: Intelligently move the correct direction based on known position if it is known.
      operateServo360({ servoName: data.target, value: selfMoveSpeed });
    }
  }
}

module.exports = sendServoToLocationUsingSwitches;
